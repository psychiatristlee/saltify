'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  uploadMediaRaw, createMediaDoc, listMedia, deleteMedia, updateMediaTags, MediaItem,
} from '@/lib/services/mediaService';
import { createPost, getAllPosts, updatePost, deletePost, BlogPost } from '@/lib/services/blogService';
import { generateBlogPost, refineBlogPost, analyzePhotoForMenuTags, GeneratedPost } from '@/lib/services/aiService';
import { MENU_BREADS, MENU_DRINKS } from '@/lib/breadData';
import { t as translate } from '@/lib/i18n';
import {
  listKeywords, addKeyword, deleteKeyword, updateKeywordRank, TrackedKeyword,
} from '@/lib/services/keywordService';
import styles from './page.module.css';

type Tab = 'media' | 'posts' | 'rankings';
type EditorMode = { type: 'idle' } | { type: 'edit'; post: BlogPost } | { type: 'generating' };

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('media');

  // Media state
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Posts state
  const [posts, setPosts] = useState<BlogPost[]>([]);

  // Rankings state
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);

  // Editor state
  const [editor, setEditor] = useState<EditorMode>({ type: 'idle' });
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [refining, setRefining] = useState(false);

  // Check admin
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdTokenResult();
        if (token.claims.admin) {
          setIsAdmin(true);
        } else {
          // fallback: check Firestore admins collection
          const snap = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(snap.exists());
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  const loadMedia = useCallback(async () => {
    const items = await listMedia();
    setMedia(items);
  }, []);

  const loadPosts = useCallback(async () => {
    const items = await getAllPosts();
    setPosts(items);
  }, []);

  const loadKeywords = useCallback(async () => {
    const items = await listKeywords();
    setKeywords(items);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadMedia();
      loadPosts();
      loadKeywords();
    }
  }, [isAdmin, loadMedia, loadPosts, loadKeywords]);

  // ----- Rankings handlers -----
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    await addKeyword(newKeyword);
    setNewKeyword('');
    await loadKeywords();
  };

  const checkKeyword = async (kw: TrackedKeyword) => {
    setCheckingId(kw.id);
    try {
      const res = await fetch(`/api/naver-rank?keyword=${encodeURIComponent(kw.keyword)}`);
      const data = await res.json();
      await updateKeywordRank(kw.id, data.rank ?? null);
      await loadKeywords();
    } catch (e) {
      console.error(e);
      alert('순위 조회 실패');
    } finally {
      setCheckingId(null);
    }
  };

  const checkAllKeywords = async () => {
    setCheckingAll(true);
    for (const kw of keywords) {
      try {
        const res = await fetch(`/api/naver-rank?keyword=${encodeURIComponent(kw.keyword)}`);
        const data = await res.json();
        await updateKeywordRank(kw.id, data.rank ?? null);
      } catch (e) {
        console.error(e);
      }
    }
    await loadKeywords();
    setCheckingAll(false);
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm('이 키워드를 삭제하시겠습니까?')) return;
    await deleteKeyword(id);
    await loadKeywords();
  };

  const handleLogin = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const fileArr = Array.from(files);
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      // 1) Storage 업로드
      const uploaded = await uploadMediaRaw(file);
      // 2) AI로 메뉴 자동 태깅 (이미지만, 실패해도 무시)
      let tags: string[] = [];
      if (uploaded.type === 'image') {
        try {
          tags = await analyzePhotoForMenuTags(file);
        } catch (err) {
          console.error('auto-tag failed', err);
        }
      }
      // 3) Firestore 메타데이터 저장
      await createMediaDoc({ ...uploaded, name: file.name, tags });
      // 4) 다음 파일 전 짧은 지연 (Gemini free tier rate limit 회피)
      if (i < fileArr.length - 1 && uploaded.type === 'image') {
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
    await loadMedia();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleSelect = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

  const handleDeleteMedia = async (item: MediaItem) => {
    if (!confirm(`${item.name} 삭제?`)) return;
    await deleteMedia(item);
    setSelected((prev) => { const n = new Set(prev); n.delete(item.url); return n; });
    await loadMedia();
  };

  // 태그 편집 상태
  const [taggingId, setTaggingId] = useState<string | null>(null);

  const toggleTag = async (item: MediaItem, menuId: string) => {
    const next = item.tags.includes(menuId)
      ? item.tags.filter((t) => t !== menuId)
      : [...item.tags, menuId];
    await updateMediaTags(item.id, next);
    await loadMedia();
  };

  const applyGenerated = (result: GeneratedPost, urls: string[]) => {
    setEditTitle(result.title);
    setEditSlug(result.slug);
    setEditDesc(result.description);
    setEditContent(result.content);
    setEditTags(result.tags.join(', '));
    setEditCover(urls[0] || result.content.match(/src="([^"]+)"/)?.[1] || '');
    setEditImages(urls);
  };

  const handleGenerate = async () => {
    const urls = Array.from(selected);
    if (!urls.length) return alert('사진을 선택해주세요');
    setEditor({ type: 'generating' });
    setTab('posts');
    try {
      const result = await generateBlogPost(urls);
      applyGenerated(result, urls);
      setEditId(null);
      setRefineFeedback('');
      setEditor({ type: 'edit', post: {} as BlogPost });
    } catch (err) {
      console.error(err);
      alert('AI 생성 실패: ' + (err instanceof Error ? err.message : 'unknown'));
      setEditor({ type: 'idle' });
    }
  };

  const handleRefine = async () => {
    if (!refineFeedback.trim()) return;
    setRefining(true);
    try {
      const current: GeneratedPost = {
        title: editTitle,
        slug: editSlug,
        description: editDesc,
        content: editContent,
        tags: editTags.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const refined = await refineBlogPost(current, refineFeedback, editImages);
      applyGenerated(refined, editImages);
      setRefineFeedback('');
    } catch (err) {
      console.error(err);
      alert('수정 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    } finally {
      setRefining(false);
    }
  };

  const openEditor = (post: BlogPost) => {
    setEditTitle(post.title);
    setEditSlug(post.slug);
    setEditDesc(post.description);
    setEditContent(post.content);
    setEditTags(post.tags.join(', '));
    setEditCover(post.coverImage);
    setEditImages(post.images);
    setEditId(post.id);
    setEditor({ type: 'edit', post });
  };

  const handleSave = async (status: 'draft' | 'published') => {
    const data = {
      title: editTitle,
      slug: editSlug,
      description: editDesc,
      content: editContent,
      coverImage: editCover,
      images: editImages,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      status,
    };
    if (editId) {
      await updatePost(editId, data);
    } else {
      await createPost(data);
    }
    setEditor({ type: 'idle' });
    setSelected(new Set());
    await loadPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 포스트를 삭제하시겠습니까?')) return;
    await deletePost(id);
    await loadPosts();
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;

  if (!user) {
    return (
      <div className={styles.loginContainer}>
        <h1>Admin</h1>
        <button onClick={handleLogin} className={styles.loginBtn}>Google 로그인</button>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className={styles.loginContainer}><h1>권한이 없습니다</h1></div>;
  }

  // Editor view
  if (editor.type === 'generating') {
    return (
      <div className={styles.container}>
        <div className={styles.generating}>
          <div className={styles.spinner} />
          <p>AI가 블로그 포스트를 작성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (editor.type === 'edit') {
    return (
      <div className={styles.container}>
        <div className={styles.editorHeader}>
          <button onClick={() => setEditor({ type: 'idle' })} className={styles.backBtn}>← 목록</button>
          <h2>{editId ? '포스트 수정' : '새 포스트'}</h2>
          {editId && editSlug && (
            <a
              href={`/blog/${editSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.openLink}
            >
              🔗 열기
            </a>
          )}
        </div>
        <div className={styles.editorForm}>
          {/* AI Refinement Box (only show for new AI-generated posts) */}
          {editImages.length > 0 && (
            <div className={styles.refineBox}>
              <label className={styles.refineLabel}>
                ✨ AI에게 수정 요청 <span className={styles.refineHint}>(직접 편집해도 됩니다)</span>
              </label>
              <textarea
                value={refineFeedback}
                onChange={(e) => setRefineFeedback(e.target.value)}
                placeholder="예: 제목을 더 재치있게 바꿔줘, 본문에 추천 페어링 음료 추가해줘, 톤을 더 캐주얼하게..."
                className={styles.textarea}
                rows={2}
                disabled={refining}
              />
              <button
                onClick={handleRefine}
                disabled={refining || !refineFeedback.trim()}
                className={styles.refineBtn}
              >
                {refining ? '수정 중...' : '🔁 AI로 다시 쓰기'}
              </button>
            </div>
          )}

          <label>제목</label>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={styles.input} />

          <label>슬러그 (URL)</label>
          <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className={styles.input} />

          <label>SEO 설명문</label>
          <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={styles.textarea} rows={3} />

          <label>태그 (쉼표 구분)</label>
          <input value={editTags} onChange={(e) => setEditTags(e.target.value)} className={styles.input} />

          <label>커버 이미지 URL</label>
          <input value={editCover} onChange={(e) => setEditCover(e.target.value)} className={styles.input} />
          {editCover && (
            <img src={editCover} alt="cover" className={styles.coverPreview} />
          )}

          <label>본문 (HTML)</label>
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className={styles.textarea} rows={20} />

          <div className={styles.previewSection}>
            <h3>미리보기</h3>
            <div className={styles.preview} dangerouslySetInnerHTML={{ __html: editContent }} />
          </div>

          <div className={styles.editorActions}>
            <button onClick={() => handleSave('draft')} className={styles.draftBtn}>💾 드래프트로 저장</button>
            <button onClick={() => handleSave('published')} className={styles.publishBtn}>✅ 최종 승인 & 퍼블리시</button>
          </div>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Blog Admin</h1>
        <div className={styles.tabs}>
          <button onClick={() => setTab('media')} className={tab === 'media' ? styles.activeTab : styles.tab}>미디어</button>
          <button onClick={() => setTab('posts')} className={tab === 'posts' ? styles.activeTab : styles.tab}>포스트</button>
          <button onClick={() => setTab('rankings')} className={tab === 'rankings' ? styles.activeTab : styles.tab}>순위</button>
        </div>
      </div>

      {tab === 'media' && (
        <div>
          <div className={styles.toolbar}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              className={styles.fileInput}
              id="media-upload"
            />
            <label htmlFor="media-upload" className={styles.uploadBtn}>
              {uploading ? '업로드 중...' : '📷 사진/영상 업로드'}
            </label>
            {selected.size > 0 && (
              <button onClick={handleGenerate} className={styles.generateBtn}>
                ✨ 선택한 {selected.size}장으로 블로그 글 생성
              </button>
            )}
          </div>

          <div className={styles.mediaGrid}>
            {media.map((item) => {
              const allMenus = [...MENU_BREADS, ...MENU_DRINKS];
              const tagLabels = item.tags
                .map((id) => {
                  const m = allMenus.find((x) => x.id === id);
                  return m ? translate(m.nameKey, 'ko') : null;
                })
                .filter(Boolean);

              return (
                <div
                  key={item.id}
                  className={`${styles.mediaItem} ${selected.has(item.url) ? styles.mediaSelected : ''}`}
                  onClick={() => toggleSelect(item.url)}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className={styles.mediaThumbnail} muted />
                  ) : (
                    <img src={item.url} alt={item.name} className={styles.mediaThumbnail} />
                  )}
                  {selected.has(item.url) && <div className={styles.checkmark}>✓</div>}
                  <button
                    className={styles.deleteMediaBtn}
                    onClick={(e) => { e.stopPropagation(); handleDeleteMedia(item); }}
                  >×</button>
                  <button
                    className={styles.tagMediaBtn}
                    onClick={(e) => { e.stopPropagation(); setTaggingId(item.id); }}
                    title="태그 편집"
                  >🏷️</button>
                  {tagLabels.length > 0 && (
                    <div className={styles.tagOverlay}>
                      {tagLabels.slice(0, 3).map((label, i) => (
                        <span key={i} className={styles.tagChip}>{label}</span>
                      ))}
                      {tagLabels.length > 3 && (
                        <span className={styles.tagChip}>+{tagLabels.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tag Editor Modal */}
          {taggingId && (() => {
            const item = media.find((m) => m.id === taggingId);
            if (!item) return null;
            const allMenus = [...MENU_BREADS, ...MENU_DRINKS];
            return (
              <div className={styles.tagModalOverlay} onClick={() => setTaggingId(null)}>
                <div className={styles.tagModal} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.tagModalHeader}>
                    <h3>메뉴 태그</h3>
                    <button onClick={() => setTaggingId(null)} className={styles.backBtn}>✕</button>
                  </div>
                  <img src={item.url} alt="" className={styles.tagModalImage} />
                  <p className={styles.tagModalHint}>
                    사진에 나오는 메뉴를 모두 선택하세요 (복수 선택 가능)
                  </p>
                  <div className={styles.tagMenuGrid}>
                    {allMenus.map((menu) => {
                      const active = item.tags.includes(menu.id);
                      return (
                        <button
                          key={menu.id}
                          onClick={() => toggleTag(item, menu.id)}
                          className={`${styles.tagMenuItem} ${active ? styles.tagMenuActive : ''}`}
                        >
                          {translate(menu.nameKey, 'ko')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {tab === 'posts' && (
        <div className={styles.postList}>
          {posts.map((post) => (
            <div key={post.id} className={styles.postItem}>
              <div className={styles.postInfo}>
                <span className={post.status === 'published' ? styles.published : styles.draft}>
                  {post.status === 'published' ? '공개' : '드래프트'}
                </span>
                <h3>{post.title}</h3>
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.postMeta}
                >
                  🔗 /blog/{post.slug}
                </a>
              </div>
              <div className={styles.postActions}>
                <button onClick={() => openEditor(post)} className={styles.editBtn}>수정</button>
                <button onClick={() => handleDelete(post.id)} className={styles.deleteBtnSmall}>삭제</button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className={styles.empty}>아직 포스트가 없습니다</p>}
        </div>
      )}

      {tab === 'rankings' && (
        <div>
          <div className={styles.toolbar}>
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              placeholder="키워드 입력 (예: 홍대 소금빵)"
              className={styles.input}
              style={{ flex: 1, minWidth: 200 }}
            />
            <button onClick={handleAddKeyword} className={styles.uploadBtn}>+ 추가</button>
            {keywords.length > 0 && (
              <button
                onClick={checkAllKeywords}
                disabled={checkingAll}
                className={styles.generateBtn}
              >
                {checkingAll ? '조회 중...' : '🔄 전체 갱신'}
              </button>
            )}
          </div>

          <div className={styles.rankList}>
            {keywords.map((kw) => {
              const isChecking = checkingId === kw.id;
              const rankDisplay =
                kw.lastRank === null
                  ? kw.lastCheckedAt ? '100위 밖' : '미확인'
                  : `${kw.lastRank}위`;
              const rankColor =
                kw.lastRank === null
                  ? '#999'
                  : kw.lastRank <= 3
                  ? '#4CAF50'
                  : kw.lastRank <= 10
                  ? '#FF8C00'
                  : '#888';

              return (
                <div key={kw.id} className={styles.rankItem}>
                  <div className={styles.rankInfo}>
                    <h3>{kw.keyword}</h3>
                    <p className={styles.rankMeta}>
                      {kw.lastCheckedAt
                        ? `마지막 조회: ${kw.lastCheckedAt.toDate().toLocaleString('ko-KR')}`
                        : '아직 조회되지 않음'}
                    </p>
                  </div>
                  <div className={styles.rankDisplay} style={{ color: rankColor }}>
                    {isChecking ? '...' : rankDisplay}
                  </div>
                  <div className={styles.postActions}>
                    <button
                      onClick={() => checkKeyword(kw)}
                      disabled={isChecking}
                      className={styles.editBtn}
                    >
                      {isChecking ? '...' : '조회'}
                    </button>
                    <button
                      onClick={() => handleDeleteKeyword(kw.id)}
                      className={styles.deleteBtnSmall}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
            {keywords.length === 0 && (
              <p className={styles.empty}>
                추적할 키워드를 추가하세요. (예: &quot;홍대 소금빵&quot;, &quot;연남동 베이커리&quot;)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
