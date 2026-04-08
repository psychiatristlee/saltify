import type { Metadata } from 'next';
import styles from './page.module.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보 처리방침 - 솔트빵',
  description: '솔트빵 서비스 개인정보 처리방침',
};

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>←</Link>
          <h1 className={styles.title}>개인정보 처리방침</h1>
        </div>

        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            솔트빵(이하 &quot;회사&quot;)은 「솔트, 빵」 서비스(이하 &quot;서비스&quot;) 제공을 위해
            다음과 같은 목적으로 개인정보를 수집·이용합니다.
          </p>
          <ul>
            <li>회원 식별 및 가입 관리</li>
            <li>게임 데이터 저장 및 동기화 (점수, 레벨, 쿠폰, 포인트)</li>
            <li>쿠폰 발급 및 사용 관리</li>
            <li>친구 초대(레퍼럴) 기능 제공</li>
            <li>서비스 이용 통계 및 분석</li>
            <li>서비스 개선 및 신규 기능 개발</li>
          </ul>

          <h2 className={styles.sectionTitle}>2. 수집하는 개인정보 항목</h2>
          <table>
            <thead>
              <tr>
                <th>수집 항목</th>
                <th>수집 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>이메일 주소, 이름(닉네임), 프로필 사진</td>
                <td>소셜 로그인 시 자동 수집 (Google, Apple, Kakao)</td>
              </tr>
              <tr>
                <td>고유 식별자(UID)</td>
                <td>계정 생성 시 자동 생성</td>
              </tr>
              <tr>
                <td>게임 기록 (점수, 레벨, 빵 포인트)</td>
                <td>서비스 이용 과정에서 자동 생성</td>
              </tr>
              <tr>
                <td>쿠폰 발급·사용 기록</td>
                <td>서비스 이용 과정에서 자동 생성</td>
              </tr>
              <tr>
                <td>초대(레퍼럴) 관계 정보</td>
                <td>친구 초대 시 자동 생성</td>
              </tr>
              <tr>
                <td>서비스 이용 기록, 접속 로그, 기기 정보</td>
                <td>서비스 이용 과정에서 자동 수집</td>
              </tr>
            </tbody>
          </table>

          <h2 className={styles.sectionTitle}>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회사는 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
          <ul>
            <li>회원 탈퇴 시: 즉시 파기</li>
            <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
            <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
          </ul>

          <h2 className={styles.sectionTitle}>4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
            다만, 다음의 경우는 예외로 합니다.
          </p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>

          <h2 className={styles.sectionTitle}>5. 개인정보 처리 위탁</h2>
          <p>회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <table>
            <thead>
              <tr>
                <th>수탁업체</th>
                <th>위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google LLC (Firebase)</td>
                <td>인증, 데이터베이스, 호스팅, 애널리틱스, 앱 체크</td>
              </tr>
            </tbody>
          </table>

          <h2 className={styles.sectionTitle}>6. 이용자의 권리 및 행사 방법</h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요청</li>
            <li>개인정보 수정 요청</li>
            <li>개인정보 삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
          </ul>
          <p>
            회원 탈퇴는 서비스 내 프로필 메뉴에서 직접 진행할 수 있으며,
            탈퇴 시 모든 개인정보 및 게임 데이터가 즉시 삭제됩니다.
          </p>

          <h2 className={styles.sectionTitle}>7. 개인정보의 파기 절차 및 방법</h2>
          <ul>
            <li>파기 절차: 이용 목적이 달성된 개인정보는 별도의 DB로 옮겨져 내부 방침에 따라 파기됩니다.</li>
            <li>파기 방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없도록 기술적 방법을 사용하여 삭제합니다.</li>
          </ul>

          <h2 className={styles.sectionTitle}>8. 쿠키(Cookie) 및 자동 수집 장치</h2>
          <p>
            회사는 서비스 이용 분석 및 보안을 위해 Google Analytics와
            reCAPTCHA를 사용하며, 이 과정에서 쿠키가 사용될 수 있습니다.
            이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나,
            일부 서비스 이용에 제한이 있을 수 있습니다.
          </p>

          <h2 className={styles.sectionTitle}>9. 개인정보 보호 책임자</h2>
          <ul>
            <li>담당자: 솔트빵 개인정보 보호 담당</li>
            <li>이메일: privacy@salt-bbang.com</li>
          </ul>

          <h2 className={styles.sectionTitle}>10. 개인정보 처리방침 변경</h2>
          <p>
            본 개인정보 처리방침은 법령·정책 또는 서비스 변경에 따라 수정될 수 있으며,
            변경 시 서비스 내 공지를 통해 안내합니다.
          </p>

          <p className={styles.effectiveDate}>시행일: 2026년 2월 8일</p>
        </div>
      </div>
    </div>
  );
}
