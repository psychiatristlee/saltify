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
import styles from './AdminView.module.css';

interface Props {
  userId: string | null;
  onClose: () => void;
}

export default function AdminView({ userId, onClose }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<BranchStats[]>([]);
  const [admins, setAdmins] = useState<UserInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'branches' | 'stats' | 'admins'>('branches');
  const [isLoading, setIsLoading] = useState(true);

  // Branch form state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchPassword, setBranchPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  // User search state
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (!userId) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const adminStatus = await isUserAdmin(userId);
      setIsAdmin(adminStatus);
      setIsLoading(false);

      if (adminStatus) {
        loadData();
      }
    }
    checkAdmin();
  }, [userId]);

  const loadData = async () => {
    const [branchData, statsData, adminData] = await Promise.all([
      getAllBranches(),
      getCouponStatsByBranch(),
      getAllAdmins(),
    ]);
    setBranches(branchData);
    setStats(statsData);
    setAdmins(adminData);
  };

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
    setShowForm(false);
    loadData();
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchPassword(branch.password);
    setShowForm(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('정말 이 지점을 삭제하시겠습니까?')) return;
    await deleteBranch(branchId);
    loadData();
  };

  const handleNewBranch = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchPassword('');
    setShowForm(true);
  };

  // User search handlers
  const handleSearchUsers = async () => {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    const results = await searchUsersByEmail(searchEmail.trim());
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddAdmin = async (user: UserInfo) => {
    if (!confirm(`${user.email}에게 관리자 권한을 부여하시겠습니까?`)) return;

    const success = await addAdminRole(user.id);
    if (success) {
      // Update local state
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isAdmin: true } : u
        )
      );
      loadData(); // Refresh admin list
    }
  };

  const handleRemoveAdmin = async (user: UserInfo) => {
    if (user.id === userId) {
      alert('자신의 관리자 권한은 제거할 수 없습니다.');
      return;
    }

    if (!confirm(`${user.email}의 관리자 권한을 제거하시겠습니까?`)) return;

    const success = await removeAdminRole(user.id);
    if (success) {
      // Update local state
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isAdmin: false } : u
        )
      );
      loadData(); // Refresh admin list
    }
  };

  if (isLoading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <p className={styles.loadingText}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <div className={styles.accessDenied}>
            <span className={styles.accessDeniedIcon}>🔒</span>
            <h2>접근 권한이 없습니다</h2>
            <p>관리자 권한이 필요합니다.</p>
            <button className={styles.closeButton} onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>관리자</h2>
          <button className={styles.headerCloseButton} onClick={onClose}>
            ✕
          </button>
        </header>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'branches' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            지점
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            통계
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'admins' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            관리자
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'branches' && (
            <div className={styles.branchSection}>
              <div className={styles.sectionHeader}>
                <h3>지점 목록</h3>
                <button className={styles.addButton} onClick={handleNewBranch}>
                  + 지점 추가
                </button>
              </div>

              {showForm && (
                <div className={styles.branchForm}>
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
                    <button
                      className={styles.cancelButton}
                      onClick={() => setShowForm(false)}
                    >
                      취소
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveBranch}
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.branchList}>
                {branches.length === 0 ? (
                  <p className={styles.emptyText}>등록된 지점이 없습니다.</p>
                ) : (
                  branches.map((branch) => (
                    <div key={branch.id} className={styles.branchItem}>
                      <div className={styles.branchInfo}>
                        <span className={styles.branchName}>{branch.name}</span>
                        <span className={styles.branchPassword}>
                          비밀번호: {branch.password}
                        </span>
                      </div>
                      <div className={styles.branchActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEditBranch(branch)}
                        >
                          수정
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteBranch(branch.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className={styles.statsSection}>
              <button className={styles.refreshButton} onClick={loadData}>
                새로고침
              </button>

              {stats.length === 0 ? (
                <p className={styles.emptyText}>사용된 쿠폰이 없습니다.</p>
              ) : (
                stats.map((stat) => (
                  <div key={stat.branchId} className={styles.statCard}>
                    <div className={styles.statHeader}>
                      <span className={styles.statBranchName}>{stat.branchName}</span>
                      <span className={styles.statTotal}>
                        총 {stat.totalUsed}건
                      </span>
                    </div>

                    <div className={styles.statBreakdown}>
                      {Object.entries(stat.usageByBreadType).map(([breadType, count]) => {
                        const bread = BREAD_DATA[Number(breadType) as BreadType];
                        return (
                          <div key={breadType} className={styles.statBreadItem}>
                            <img
                              src={bread.image}
                              alt={bread.nameKo}
                              className={styles.statBreadImage}
                            />
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
                                {usage.usedAt
                                  ? new Date(usage.usedAt).toLocaleDateString('ko-KR')
                                  : '-'}
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

          {activeTab === 'admins' && (
            <div className={styles.adminsSection}>
              {/* Current Admins */}
              <div className={styles.sectionHeader}>
                <h3>현재 관리자</h3>
              </div>
              <div className={styles.adminList}>
                {admins.length === 0 ? (
                  <p className={styles.emptyText}>등록된 관리자가 없습니다.</p>
                ) : (
                  admins.map((admin) => (
                    <div key={admin.id} className={styles.adminItem}>
                      <div className={styles.adminInfo}>
                        {admin.photoURL ? (
                          <img
                            src={admin.photoURL}
                            alt=""
                            className={styles.adminAvatar}
                          />
                        ) : (
                          <div className={styles.adminAvatarPlaceholder}>👤</div>
                        )}
                        <div className={styles.adminDetails}>
                          <span className={styles.adminName}>
                            {admin.displayName}
                          </span>
                          <span className={styles.adminEmail}>{admin.email}</span>
                        </div>
                      </div>
                      {admin.id !== userId && (
                        <button
                          className={styles.removeAdminButton}
                          onClick={() => handleRemoveAdmin(admin)}
                        >
                          권한 제거
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Search Users */}
              <div className={styles.searchSection}>
                <h3>사용자 검색</h3>
                <div className={styles.searchBox}>
                  <input
                    type="email"
                    placeholder="이메일로 검색"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                    className={styles.searchInput}
                  />
                  <button
                    className={styles.searchButton}
                    onClick={handleSearchUsers}
                    disabled={isSearching}
                  >
                    {isSearching ? '검색 중...' : '검색'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults.map((user) => (
                      <div key={user.id} className={styles.searchResultItem}>
                        <div className={styles.adminInfo}>
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt=""
                              className={styles.adminAvatar}
                            />
                          ) : (
                            <div className={styles.adminAvatarPlaceholder}>👤</div>
                          )}
                          <div className={styles.adminDetails}>
                            <span className={styles.adminName}>
                              {user.displayName}
                              {user.isAdmin && (
                                <span className={styles.adminBadge}>관리자</span>
                              )}
                            </span>
                            <span className={styles.adminEmail}>{user.email}</span>
                          </div>
                        </div>
                        {user.isAdmin ? (
                          user.id !== userId && (
                            <button
                              className={styles.removeAdminButton}
                              onClick={() => handleRemoveAdmin(user)}
                            >
                              권한 제거
                            </button>
                          )
                        ) : (
                          <button
                            className={styles.addAdminButton}
                            onClick={() => handleAddAdmin(user)}
                          >
                            관리자 추가
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
