import { useEffect, useRef, useState } from 'react';
import {
  listMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
  uploadMenuImage,
  MenuItem, MenuItemDraft, MenuCategory,
} from '../services/menu';
import styles from './AdminPage.module.css';

const EMPTY_DRAFT: MenuItemDraft = {
  name: '',
  description: '',
  price: 0,
  image: '',
  imagePath: '',
  category: 'bread',
  available: true,
  sortOrder: 0,
};

const CATEGORY_LABEL: Record<MenuCategory, string> = {
  bread: '🥖 빵',
  drink: '☕ 음료',
  tteok: '🍡 떡',
  other: '기타',
};

export default function MenuAdminTab() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [draft, setDraft] = useState<MenuItemDraft>(EMPTY_DRAFT);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setItems(await listMenuItems());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setDraft({
      ...EMPTY_DRAFT,
      sortOrder: items.length === 0 ? 10 : Math.max(...items.map((i) => i.sortOrder ?? 0)) + 10,
    });
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setDraft({
      name: item.name,
      nameEn: item.nameEn,
      nameJa: item.nameJa,
      nameZh: item.nameZh,
      description: item.description ?? '',
      price: item.price,
      image: item.image,
      imagePath: item.imagePath,
      category: item.category ?? 'bread',
      available: item.available ?? true,
      sortOrder: item.sortOrder ?? 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, path } = await uploadMenuImage(file);
      setDraft((d) => ({ ...d, image: url, imagePath: path }));
    } catch (err) {
      console.error('image upload failed', err);
      alert('이미지 업로드 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      alert('메뉴 이름을 입력하세요');
      return;
    }
    if (!Number.isFinite(draft.price) || draft.price < 0) {
      alert('가격을 올바르게 입력하세요');
      return;
    }
    try {
      if (editing) {
        await updateMenuItem(editing.id, draft);
      } else {
        await createMenuItem(draft);
      }
      closeForm();
      await reload();
    } catch (err) {
      alert('저장 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`정말 "${item.name}" 메뉴를 삭제하시겠습니까?`)) return;
    try {
      await deleteMenuItem(item);
      await reload();
    } catch (err) {
      alert('삭제 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { available: !item.available });
      await reload();
    } catch (err) {
      alert('변경 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>메뉴 ({items.length})</h3>
        <button className={styles.addButton} onClick={openAdd}>+ 메뉴 추가</button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h4>{editing ? '메뉴 수정' : '새 메뉴 추가'}</h4>

          <input
            className={styles.input}
            placeholder="메뉴 이름 (한국어, 필수)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder="가격 (원)"
            type="number"
            min={0}
            step={100}
            value={draft.price || ''}
            onChange={(e) => setDraft({ ...draft, price: parseInt(e.target.value, 10) || 0 })}
          />
          <textarea
            className={styles.input}
            placeholder="설명 (선택)"
            value={draft.description ?? ''}
            rows={2}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />

          <select
            className={styles.input}
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as MenuCategory })}
          >
            <option value="bread">🥖 빵</option>
            <option value="drink">☕ 음료</option>
            <option value="tteok">🍡 떡</option>
            <option value="other">기타</option>
          </select>

          <input
            className={styles.input}
            placeholder="정렬 순서 (작을수록 위로)"
            type="number"
            value={draft.sortOrder}
            onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value, 10) || 0 })}
          />

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={draft.available}
              onChange={(e) => setDraft({ ...draft, available: e.target.checked })}
            />
            <span>판매 가능 (꺼지면 사용자에게 안 보임)</span>
          </label>

          {/* Image */}
          <div className={styles.imageRow}>
            {draft.image ? (
              <img src={draft.image} alt="" className={styles.imagePreview} />
            ) : (
              <div className={styles.imagePlaceholder}>이미지 없음</div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="menu-image-input"
            />
            <label htmlFor="menu-image-input" className={styles.cancelButton}>
              {uploading ? '업로드 중...' : draft.image ? '이미지 변경' : '이미지 업로드'}
            </label>
          </div>

          <div className={styles.formButtons}>
            <button className={styles.cancelButton} onClick={closeForm}>취소</button>
            <button className={styles.saveButton} onClick={handleSave} disabled={uploading}>
              저장
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className={styles.emptyHint}>아직 등록된 메뉴가 없습니다. + 메뉴 추가를 눌러 시작하세요.</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} className={styles.listItem}>
              {item.image ? (
                <img src={item.image} alt={item.name} className={styles.listItemImage} />
              ) : (
                <div className={styles.listItemImagePlaceholder}>—</div>
              )}
              <div className={styles.listItemBody}>
                <div className={styles.listItemTitleRow}>
                  <strong>{item.name}</strong>
                  {!item.available && <span className={styles.disabledBadge}>비활성</span>}
                </div>
                <span className={styles.listItemMeta}>
                  {CATEGORY_LABEL[item.category ?? 'bread']} · {item.price.toLocaleString()}원
                  · #{item.sortOrder ?? 0}
                </span>
                {item.description && (
                  <span className={styles.listItemDesc}>{item.description}</span>
                )}
              </div>
              <div className={styles.listItemActions}>
                <button
                  className={styles.smallButton}
                  onClick={() => toggleAvailable(item)}
                  title={item.available ? '판매 중지' : '판매 재개'}
                >
                  {item.available ? '🟢' : '⚪️'}
                </button>
                <button className={styles.smallButton} onClick={() => openEdit(item)}>수정</button>
                <button
                  className={`${styles.smallButton} ${styles.dangerButton}`}
                  onClick={() => handleDelete(item)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
