import { useState, useEffect } from 'react';
import {
  isUserAdmin,
  getAllBranches,
  saveBranch,
  deleteBranch,
  getCouponStatsByBranch,
  searchUsersByEmail,
  getAllAdmins,
  addAdminRole,
  removeAdminRole,
  Branch,
  BranchStats,
  UserInfo,
} from '../services/admin';
import { BREAD_DATA, BreadType } from '../models/BreadType';
import { useAuth } from '../hooks/useAuth';
import styles from './AdminPage.module.css';

type TabType = 'branches' | 'stats' | 'admins';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('branches');

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<BranchStats[]>([]);
  const [admins, setAdmins] = useState<UserInfo[]>([]);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchPassword, setBranchPassword] = useState('');
  const [showBranchForm, setShowBranchForm] = useState(false);

  // Admin search state
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return;
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      const adminStatus = await isUserAdmin(user.id);
      setIsAdmin(adminStatus);
      setIsLoading(false);
      if (adminStatus) {
        loadAllData();
      }
    }
    checkAdmin();
  }, [user, authLoading]);

  const loadAllData = async () => {
    const [branchData, statsData, adminData] = await Promise.all([
      getAllBranches(),
      getCouponStatsByBranch(),
      getAllAdmins(),
    ]);
    setBranches(branchData);
    setStats(statsData);
    setAdmins(adminData);
  };

  // ─── Branch handlers ───
  const handleSaveBranch = async () => {
    if (!branchName.trim() || !branchPassword.trim()) return;
    await saveBranch({
      id: editingBranch?.id,
      name: branchName.trim(),
      password: branchPassword.trim(),
    });
    setBranchName('');
    setBranchPassword('');
    setEditingBranch(null);
    setShowBranchForm(false);
    loadAllData();
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchPassword(branch.password);
    setShowBranchForm(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('정말 이 지점을 삭제하시겠습니까?')) return;
    await deleteBranch(branchId);
    loadAllData();
  };

  // ─── Admin handlers ───
  const handleSearchUsers = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    const results = await searchUsersByEmail(searchEmail.trim());
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddAdmin = async (u: UserInfo) => {
    if (!confirm(`${u.email}에게 관리자 권한을 부여하시겠습니까?`)) return;
    const success = await addAdminRole(u.id);
    if (success) {
      setSearchResults((prev) => prev.map((x) => x.id === u.id ? { ...x, isAdmin: true } : x));
      loadAllData();
    }
  };

  const handleRemoveAdmin = async (u: UserInfo) => {
    if (u.id === user?.id) {
      alert('자신의 관리자 권한은 제거할 수 없습니다.');
      return;
    }
    if (!confirm(`${u.email}의 관리자 권한을 제거하시겠습니까?`)) return;
    const success = await removeAdminRole(u.id);
    if (success) {
      setSearchResults((prev) => prev.map((x) => x.id === u.id ? { ...x, isAdmin: false } : x));
      loadAllData();
    }
  };

  // ─── Render ───
  if (isLoading || authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          <span className={styles.accessDeniedIcon}>&#128274;</span>
          <h2>접근 권한이 없습니다</h2>
          <p>관리자 권한이 필요합니다.</p>
          <a href="/" className={styles.backButton}>홈으로</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.headerLogo}>솔트빵</a>
        <h1 className={styles.headerTitle}>관리자</h1>
        <span className={styles.headerUser}>{user?.displayName || user?.email}</span>
      </header>

      <nav className={styles.tabs}>
        {(['branches', 'stats', 'admins'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'branches' ? '지점' : tab === 'stats' ? '통계' : '관리자'}
          </button>
        ))}
      </nav>

      <main className={styles.content}>
        {/* ═══ Branches Tab ═══ */}
        {activeTab === 'branches' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>지점 목록</h3>
              <button
                className={styles.addButton}
                onClick={() => {
                  setEditingBranch(null);
                  setBranchName('');
                  setBranchPassword('');
                  setShowBranchForm(true);
                }}
              >
                + 지점 추가
              </button>
            </div>

            {showBranchForm && (
              <div className={styles.formCard}>
                <h4>{editingBranch ? '지점 수정' : '새 지점 추가'}</h4>
                <input
                  type="text"
                  placeholder="지점명"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="비밀번호 (4자리)"
                  value={branchPassword}
                  onChange={(e) => setBranchPassword(e.target.value)}
                  maxLength={4}
                  className={styles.input}
                />
                <div className={styles.formButtons}>
                  <button className={styles.cancelButton} onClick={() => setShowBranchForm(false)}>취소</button>
                  <button className={styles.saveButton} onClick={handleSaveBranch}>저장</button>
                </div>
              </div>
            )}

            <div className={styles.list}>
              {branches.length === 0 ? (
                <p className={styles.emptyText}>등록된 지점이 없습니다.</p>
              ) : (
                branches.map((branch) => (
                  <div key={branch.id} className={styles.listItem}>
                    <div className={styles.listItemInfo}>
                      <span className={styles.listItemTitle}>{branch.name}</span>
                      <span className={styles.listItemSub}>비밀번호: {branch.password}</span>
                    </div>
                    <div className={styles.listItemActions}>
                      <button className={styles.editButton} onClick={() => handleEditBranch(branch)}>수정</button>
                      <button className={styles.deleteButton} onClick={() => handleDeleteBranch(branch.id)}>삭제</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══ Stats Tab ═══ */}
        {activeTab === 'stats' && (
          <div className={styles.section}>
            <button className={styles.refreshButton} onClick={loadAllData}>새로고침</button>
            {stats.length === 0 ? (
              <p className={styles.emptyText}>사용된 쿠폰이 없습니다.</p>
            ) : (
              stats.map((stat) => (
                <div key={stat.branchId} className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statBranchName}>{stat.branchName}</span>
                    <span className={styles.statTotal}>총 {stat.totalUsed}건</span>
                  </div>
                  <div className={styles.statBreakdown}>
                    {Object.entries(stat.usageByBreadType).map(([breadType, count]) => {
                      const bread = BREAD_DATA[Number(breadType) as BreadType];
                      return (
                        <div key={breadType} className={styles.statBreadItem}>
                          <img src={bread.image} alt={bread.nameKo} className={styles.statBreadImage} />
                          <span className={styles.statBreadName}>{bread.nameKo}</span>
                          <span className={styles.statBreadCount}>{count}건</span>
                        </div>
                      );
                    })}
                  </div>
                  {stat.recentUsages.length > 0 && (
                    <div className={styles.recentUsages}>
                      <h5>최근 사용 내역</h5>
                      {stat.recentUsages.slice(0, 5).map((usage) => {
                        const bread = BREAD_DATA[usage.breadType as BreadType];
                        return (
                          <div key={usage.couponId} className={styles.usageItem}>
                            <span>{bread?.nameKo || '알 수 없음'}</span>
                            <span className={styles.usageDate}>
                              {usage.usedAt ? new Date(usage.usedAt).toLocaleDateString('ko-KR') : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══ Admins Tab ═══ */}
        {activeTab === 'admins' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>현재 관리자</h3>
            </div>
            <div className={styles.list}>
              {admins.map((admin) => (
                <div key={admin.id} className={styles.listItem}>
                  <div className={styles.adminInfo}>
                    {admin.photoURL ? (
                      <img src={admin.photoURL} alt="" className={styles.adminAvatar} referrerPolicy="no-referrer" />
                    ) : (
                      <div className={styles.adminAvatarPlaceholder}>&#128100;</div>
                    )}
                    <div className={styles.adminDetails}>
                      <span className={styles.listItemTitle}>{admin.displayName}</span>
                      <span className={styles.listItemSub}>{admin.email}</span>
                    </div>
                  </div>
                  {admin.id !== user?.id && (
                    <button className={styles.deleteButton} onClick={() => handleRemoveAdmin(admin)}>권한 제거</button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.divider} />

            <h3 className={styles.subTitle}>사용자 검색</h3>
            <div className={styles.searchBox}>
              <input
                type="email"
                placeholder="이메일로 검색"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className={styles.searchInput}
              />
              <button className={styles.searchButton} onClick={handleSearchUsers} disabled={isSearching}>
                {isSearching ? '검색 중...' : '검색'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className={styles.list}>
                {searchResults.map((u) => (
                  <div key={u.id} className={styles.listItem}>
                    <div className={styles.adminInfo}>
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className={styles.adminAvatar} referrerPolicy="no-referrer" />
                      ) : (
                        <div className={styles.adminAvatarPlaceholder}>&#128100;</div>
                      )}
                      <div className={styles.adminDetails}>
                        <span className={styles.listItemTitle}>
                          {u.displayName}
                          {u.isAdmin && <span className={styles.adminBadge}>관리자</span>}
                        </span>
                        <span className={styles.listItemSub}>{u.email}</span>
                      </div>
                    </div>
                    {u.isAdmin ? (
                      u.id !== user?.id && (
                        <button className={styles.deleteButton} onClick={() => handleRemoveAdmin(u)}>권한 제거</button>
                      )
                    ) : (
                      <button className={styles.addButton} onClick={() => handleAddAdmin(u)}>관리자 추가</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
