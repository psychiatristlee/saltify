import { useNavigate } from 'react-router-dom';
import styles from './PrivacyPolicy.module.css';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ←
        </button>
        <h1 className={styles.title}>이용약관</h1>
      </div>

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>제1조 (목적)</h2>
        <p>
          본 약관은 솔트빵(이하 "회사")이 제공하는 「솔트, 빵」 서비스(이하 "서비스")의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>

        <h2 className={styles.sectionTitle}>제2조 (정의)</h2>
        <ul>
          <li>"서비스"란 회사가 제공하는 「솔트, 빵」 모바일 게임 및 웹 서비스를 말합니다.</li>
          <li>"이용자"란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
          <li>"회원"이란 서비스에 가입하여 계정을 생성한 이용자를 말합니다.</li>
          <li>"콘텐츠"란 서비스 내에서 제공되는 게임, 포인트, 쿠폰 등 일체의 디지털 자산을 말합니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</h2>
        <ul>
          <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
          <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 변경 시 적용일자 7일 전부터 서비스 내 공지합니다.</li>
          <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>제4조 (서비스의 내용)</h2>
        <p>회사는 다음과 같은 서비스를 제공합니다.</p>
        <ul>
          <li>빵 매치 퍼즐 게임</li>
          <li>게임 기록 저장 및 랭킹 시스템</li>
          <li>빵 포인트 적립 및 쿠폰 발급</li>
          <li>친구 초대(레퍼럴) 기능</li>
          <li>기타 회사가 정하는 서비스</li>
        </ul>

        <h2 className={styles.sectionTitle}>제5조 (회원 가입 및 계정)</h2>
        <ul>
          <li>서비스 이용을 위해 소셜 계정(Google, Apple, Kakao, 토스)을 통한 로그인이 필요합니다.</li>
          <li>회원은 1개의 계정만 사용할 수 있으며, 타인의 계정을 사용해서는 안 됩니다.</li>
          <li>회원은 자신의 계정 정보를 관리할 책임이 있으며, 이를 제3자에게 양도하거나 대여할 수 없습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>제6조 (이용자의 의무)</h2>
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>비정상적인 방법으로 게임 점수, 포인트, 쿠폰 등을 획득하는 행위</li>
          <li>자동화 프로그램(봇, 매크로 등)을 사용하는 행위</li>
          <li>다른 이용자의 개인정보를 수집하거나 침해하는 행위</li>
          <li>서비스를 상업적 목적으로 무단 이용하는 행위</li>
          <li>기타 관련 법령에 위반되는 행위</li>
        </ul>

        <h2 className={styles.sectionTitle}>제7조 (쿠폰 및 포인트)</h2>
        <ul>
          <li>쿠폰과 포인트는 서비스 내 게임 활동을 통해 획득할 수 있습니다.</li>
          <li>쿠폰은 회사가 정한 조건과 기간 내에 사용할 수 있으며, 유효기간 경과 시 소멸됩니다.</li>
          <li>쿠폰과 포인트는 현금으로 환불되지 않으며, 타인에게 양도할 수 없습니다.</li>
          <li>비정상적인 방법으로 획득한 쿠폰과 포인트는 회수될 수 있습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>제8조 (서비스의 중단 및 변경)</h2>
        <ul>
          <li>회사는 시스템 점검, 기술적 장애, 천재지변 등 불가피한 사유로 서비스를 일시적으로 중단할 수 있습니다.</li>
          <li>회사는 서비스의 내용, 운영 방식 등을 변경할 수 있으며, 중요한 변경 시 사전 공지합니다.</li>
          <li>회사는 서비스 중단으로 인한 손해에 대해 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>제9조 (회원 탈퇴 및 이용 제한)</h2>
        <ul>
          <li>회원은 언제든지 서비스 내 프로필 메뉴를 통해 탈퇴할 수 있습니다.</li>
          <li>탈퇴 시 회원의 모든 게임 데이터, 포인트, 쿠폰이 삭제되며 복구할 수 없습니다.</li>
          <li>회사는 이용자가 본 약관을 위반한 경우 사전 통보 없이 서비스 이용을 제한하거나 계정을 삭제할 수 있습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>제10조 (면책 조항)</h2>
        <ul>
          <li>회사는 무료로 제공하는 서비스에 대해 관련 법령에서 정하는 범위 내에서 책임을 부담합니다.</li>
          <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
          <li>회사는 이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 관여하지 않으며 책임을 지지 않습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>제11조 (지적재산권)</h2>
        <p>
          서비스에 포함된 모든 콘텐츠(이미지, 텍스트, 소프트웨어 등)에 대한 저작권 및
          지적재산권은 회사에 귀속됩니다. 이용자는 회사의 사전 승인 없이
          서비스의 콘텐츠를 복제, 배포, 수정할 수 없습니다.
        </p>

        <h2 className={styles.sectionTitle}>제12조 (분쟁 해결)</h2>
        <ul>
          <li>본 약관과 관련된 분쟁은 대한민국 법률에 따라 해결합니다.</li>
          <li>서비스 이용과 관련하여 분쟁이 발생한 경우 서울중앙지방법원을 관할 법원으로 합니다.</li>
        </ul>

        <p className={styles.effectiveDate}>시행일: 2026년 2월 22일</p>
      </div>
      </div>
    </div>
  );
}
