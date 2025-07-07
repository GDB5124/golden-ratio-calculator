# 배포 가이드 (Deployment Guide)

## 1. Netlify 배포 (가장 간단)

### 자동 배포 (GitHub 연동)
1. [Netlify](https://netlify.com)에 가입
2. "New site from Git" 클릭
3. GitHub 저장소 선택
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `build`
5. "Deploy site" 클릭

### 수동 배포
```bash
# 프로덕션 빌드
npm run build

# Netlify CLI 설치
npm install -g netlify-cli

# 배포
netlify deploy --prod --dir=build
```

## 2. Vercel 배포

### 자동 배포
1. [Vercel](https://vercel.com)에 가입
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 자동으로 React 앱 감지됨
5. "Deploy" 클릭

### 수동 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel --prod
```

## 3. GitHub Pages 배포

### 설정
1. `package.json`에 homepage 추가:
```json
{
  "homepage": "https://yourusername.github.io/repository-name"
}
```

2. gh-pages 패키지 설치:
```bash
npm install --save-dev gh-pages
```

3. `package.json`에 스크립트 추가:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 배포
```bash
npm run deploy
```

## 4. Firebase Hosting 배포

### 설정
1. Firebase CLI 설치:
```bash
npm install -g firebase-tools
```

2. Firebase 로그인:
```bash
firebase login
```

3. 프로젝트 초기화:
```bash
firebase init hosting
```

### 배포
```bash
npm run build
firebase deploy
```

## 5. AWS S3 + CloudFront 배포

### 설정
1. AWS CLI 설치 및 설정
2. S3 버킷 생성
3. CloudFront 배포 생성

### 배포 스크립트
```bash
# 빌드
npm run build

# S3에 업로드
aws s3 sync build/ s3://your-bucket-name --delete

# CloudFront 무효화
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 6. Docker 배포

### Dockerfile 생성
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 배포
```bash
# 이미지 빌드
docker build -t golden-ratio-calculator .

# 컨테이너 실행
docker run -p 80:80 golden-ratio-calculator
```

## 7. 로컬 테스트

### 개발 서버
```bash
npm start
```

### 프로덕션 빌드 테스트
```bash
npm run build
npx serve -s build
```

## 8. 환경 변수 설정

### .env 파일 (필요시)
```env
REACT_APP_API_URL=https://your-api-url.com
REACT_APP_GA_TRACKING_ID=GA-XXXXXXXXX
```

## 9. 성능 최적화

### 빌드 최적화
```bash
# 프로덕션 빌드
npm run build

# 번들 분석
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### 이미지 최적화
- WebP 형식 사용
- 적절한 이미지 크기 설정
- lazy loading 구현

## 10. 모니터링 및 분석

### Google Analytics 추가
```html
<!-- public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 에러 모니터링
- Sentry 설정
- LogRocket 설정
- Bugsnag 설정

## 11. 보안 설정

### HTTPS 강제
- 모든 배포 플랫폼에서 HTTPS 자동 설정
- HSTS 헤더 설정

### CSP (Content Security Policy)
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
```

## 12. 백업 및 복구

### 정기 백업
- 소스 코드: GitHub
- 빌드 파일: 배포 플랫폼별 백업
- 환경 설정: 문서화

### 복구 절차
1. 소스 코드 복원
2. 의존성 재설치
3. 빌드 및 배포
4. 기능 테스트 