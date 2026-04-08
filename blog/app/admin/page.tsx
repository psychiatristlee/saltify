'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { uploadMedia, listMedia, deleteMedia, MediaItem } from '@/lib/services/mediaService';
import { createPost, getAllPosts, updatePost, deletePost, BlogPost } from '@/lib/services/blogService';
import { generateBlogPost } from '@/lib/services/aiService';
import styles from './page.module.css';

type Tab = 'media' | 'posts';
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

  useEffect(() => {
    if (isAdmin) {
      loadMedia();
      loadPosts();
    }
  }, [isAdmin, loadMedia, loadPosts]);

  const handleLogin = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadMedia(file);
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
    await deleteMedia(item.path);
    setSelected((prev) => { const n = new Set(prev); n.delete(item.url); return n; });
    await loadMedia();
  };

  const handleGenerate = async () => {
    const urls = Array.from(selected);
    if (!urls.length) return alert('사진을 선택해주세요');
    setEditor({ type: 'generating' });
    setTab('posts');
    try {
      const result = await generateBlogPost(urls);
      setEditTitle(result.title);
      setEditSlug(result.slug);
      setEditDesc(result.description);
      setEditContent(result.content);
      setEditTags(result.tags.join(', '));
      setEditCover(urls[0]);
      setEditImages(urls);
      setEditId(null);
      setEditor({ type: 'edit', post: {} as BlogPost });
    } catch (err) {
      console.error(err);
      alert('AI 생성 실패');
      setEditor({ type: 'idle' });
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
        </div>
        <div className={styles.editorForm}>
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
            <button onClick={() => handleSave('draft')} className={styles.draftBtn}>드래프트 저장</button>
            <button onClick={() => handleSave('published')} className={styles.publishBtn}>퍼블리시</button>
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
            {media.map((item) => (
              <div
                key={item.path}
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
              </div>
            ))}
          </div>
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
                <p className={styles.postMeta}>/blog/{post.slug}</p>
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
    </div>
  );
}
