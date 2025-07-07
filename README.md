# 황금비율 측정기 (Golden Ratio Calculator)

이미지에서 두 거리의 비율을 측정하여 황금비율(1.618)에 얼마나 가까운지 확인할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 📸 **이미지 업로드**: 로컬 이미지 파일을 업로드하여 분석
- 📱 **카메라 촬영**: 실시간 카메라로 사진을 찍어 분석
- 🎯 **정확한 측정**: 캔버스에서 4개의 점을 클릭하여 두 거리 측정
- 📊 **비율 계산**: 두 거리의 비율을 자동으로 계산
- 🎨 **시각적 피드백**: 비율에 따른 색상 표시 (1.618에 가까울수록 초록색)
- 🔄 **초기화**: 언제든지 다시 시작할 수 있는 초기화 기능

## 사용 방법

1. **이미지 준비**: "사진 선택" 버튼으로 이미지를 업로드하거나 "카메라 시작" 버튼으로 사진을 촬영
2. **점 찍기**: 이미지에서 4개의 점을 순서대로 클릭
   - P1, P2: 첫 번째 거리 측정
   - P3, P4: 두 번째 거리 측정
3. **결과 확인**: 자동으로 계산된 비율과 색상을 확인

## 비율 색상 표시

- 🟢 **초록색**: 1.5 이상 (황금비율에 가까움)
- 🟡 **노란색**: 1.75 이상
- 🟠 **주황색**: 2.0 이상
- 🔴 **빨간색**: 3.0 초과

## 배포 방법

### 1. 로컬 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 2. 프로덕션 빌드

```bash
# 프로덕션용 빌드
npm run build
```

### 3. 배포 옵션

#### A. Netlify 배포 (추천)
1. [Netlify](https://netlify.com)에 가입
2. GitHub 저장소 연결
3. 빌드 명령어: `npm run build`
4. 배포 디렉토리: `build`

#### B. Vercel 배포
1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 자동으로 React 앱 감지하여 배포

#### C. GitHub Pages 배포
1. `package.json`에 `"homepage": "https://yourusername.github.io/repository-name"` 추가
2. `gh-pages` 패키지 설치: `npm install --save-dev gh-pages`
3. `package.json`에 스크립트 추가:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```
4. `npm run deploy` 실행

#### D. Firebase Hosting 배포
1. Firebase CLI 설치: `npm install -g firebase-tools`
2. Firebase 프로젝트 초기화: `firebase init hosting`
3. 빌드 디렉토리: `build`
4. 배포: `firebase deploy`

## 기술 스택

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Canvas API**: 이미지 렌더링 및 점 그리기
- **MediaDevices API**: 카메라 접근
- **File API**: 이미지 파일 처리

## 브라우저 지원

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 라이선스

MIT License

## 기여하기

버그 리포트나 기능 제안은 이슈를 통해 제출해주세요. 