import { useNavigate } from 'react-router-dom';
import styles from './PrivacyPolicy.module.css';

export default function AccountDeletion() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ←
        </button>
        <h1 className={styles.title}>계정 삭제 안내</h1>
      </div>

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>솔트빵 (Salt, Bread) 계정 삭제</h2>
        <p>
          솔트빵 서비스의 계정 및 관련 데이터 삭제를 원하시는 경우,
          아래 안내에 따라 직접 삭제를 요청하실 수 있습니다.
        </p>

        <h2 className={styles.sectionTitle}>계정 삭제 방법</h2>
        <p>앱 내에서 직접 계정을 삭제할 수 있습니다.</p>
        <ol>
          <li><strong>솔트빵 앱</strong>을 실행합니다.</li>
          <li>로그인 후 게임 화면 우측 상단의 <strong>프로필 아이콘 (👤)</strong>을 탭합니다.</li>
          <li>프로필 화면 하단의 <strong>"계정 삭제"</strong> 버튼을 탭합니다.</li>
          <li>확인 대화상자에서 <strong>"삭제"</strong>를 선택하면 계정이 즉시 삭제됩니다.</li>
        </ol>

        <h2 className={styles.sectionTitle}>삭제되는 데이터</h2>
        <p>계정 삭제 시 다음 데이터가 <strong>즉시 영구 삭제</strong>되며 복구할 수 없습니다.</p>
        <table>
          <thead>
            <tr>
              <th>데이터 유형</th>
              <th>처리 방식</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>계정 정보 (UID, 이메일, 이름, 프로필 사진)</td>
              <td>즉시 삭제</td>
            </tr>
            <tr>
              <td>게임 기록 (점수, 레벨, 최고 기록)</td>
              <td>즉시 삭제</td>
            </tr>
            <tr>
              <td>빵 포인트 및 쿠폰</td>
              <td>즉시 삭제</td>
            </tr>
            <tr>
              <td>친구 초대(레퍼럴) 기록</td>
              <td>즉시 삭제</td>
            </tr>
            <tr>
              <td>캐릭터 및 경험치 데이터</td>
              <td>즉시 삭제</td>
            </tr>
            <tr>
              <td>랭킹 데이터</td>
              <td>즉시 삭제</td>
            </tr>
          </tbody>
        </table>

        <h2 className={styles.sectionTitle}>보관되는 데이터</h2>
        <p>관련 법령에 따라 다음 데이터는 일정 기간 보관 후 파기됩니다.</p>
        <table>
          <thead>
            <tr>
              <th>데이터 유형</th>
              <th>보관 기간</th>
              <th>근거 법령</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>접속 로그 기록</td>
              <td>3개월</td>
              <td>통신비밀보호법</td>
            </tr>
            <tr>
              <td>전자상거래 관련 기록</td>
              <td>5년</td>
              <td>전자상거래법</td>
            </tr>
          </tbody>
        </table>

        <h2 className={styles.sectionTitle}>문의</h2>
        <p>
          계정 삭제와 관련하여 추가 문의가 있으시면
          아래 이메일로 연락해 주세요.
        </p>
        <ul>
          <li>이메일: privacy@salt-bbang.com</li>
        </ul>

        <p className={styles.effectiveDate}>시행일: 2026년 2월 22일</p>
      </div>
      </div>
    </div>
  );
}
