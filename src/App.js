import React, { useRef, useState, useEffect, useCallback } from 'react';

const App = () => {
  // Refs
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  
  // State
  const [image, setImage] = useState(null);
  // 점 상태를 상대좌표로 저장
  const [points, setPoints] = useState([]); // [{ relX, relY }]
  const [distances, setDistances] = useState([]);
  const [ratio, setRatio] = useState(null);
  const [ratioColor, setRatioColor] = useState('bg-gray-200');
  const [message, setMessage] = useState('사진을 업로드하거나 카메라를 시작하여 시작하세요.');
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPhotoReady, setIsPhotoReady] = useState(false);
  const [showImageBounds, setShowImageBounds] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Get ratio color based on golden ratio (1.618)
  const getRatioColor = useCallback((ratioValue) => {
    if (ratioValue === null) return 'bg-gray-200';
    
    const goldenRatio = 1.618;
    const difference = Math.abs(ratioValue - goldenRatio);
    
    if (difference <= 0.1) return 'bg-green-500';
    if (difference <= 0.2) return 'bg-green-400';
    if (difference <= 0.3) return 'bg-yellow-500';
    if (difference <= 0.5) return 'bg-orange-500';
    return 'bg-red-500';
  }, []);

  // drawImage 파라미터 계산 함수 (중복 방지)
  const getDrawImageParams = (canvas, image) => {
    const aspectRatio = image.width / image.height;
    let drawWidth = canvas.width;
    let drawHeight = canvas.width / aspectRatio;
    if (drawHeight > canvas.height) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * aspectRatio;
    }
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;
    return { offsetX, offsetY, drawWidth, drawHeight };
  };

  // 터치 디바이스 감지
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
      console.log('터치 디바이스 감지:', hasTouch);
    };
    
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  // drawCanvas 함수
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { offsetX, offsetY, drawWidth, drawHeight } = getDrawImageParams(canvas, image);
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    if (showImageBounds) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);
      ctx.setLineDash([]);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(offsetX - 3, offsetY - 3, 6, 6);
      ctx.fillRect(offsetX + drawWidth - 3, offsetY - 3, 6, 6);
      ctx.fillRect(offsetX - 3, offsetY + drawHeight - 3, 6, 6);
      ctx.fillRect(offsetX + drawWidth - 3, offsetY + drawHeight - 3, 6, 6);
    }
    points.forEach((point, index) => {
      if (typeof point.relX === 'number' && typeof point.relY === 'number') {
        const x = offsetX + point.relX * drawWidth;
        const y = offsetY + point.relY * drawHeight;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
        ctx.closePath();
        ctx.font = '14px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(`P${index + 1}`, x + 8, y - 8);
        if (index === 1 && points.length >= 2) {
          const x0 = offsetX + points[0].relX * drawWidth;
          const y0 = offsetY + points[0].relY * drawHeight;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#0000FF';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.closePath();
        } else if (index === 3 && points.length >= 4) {
          const x2 = offsetX + points[2].relX * drawWidth;
          const y2 = offsetY + points[2].relY * drawHeight;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#008000';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.closePath();
        }
      }
    });
  }, [image, points, showImageBounds]);

  // drawImage 영역 내 거리 계산
  const calculateDistanceRel = (p1, p2, drawWidth, drawHeight) => {
    const dx = (p1.relX - p2.relX) * drawWidth;
    const dy = (p1.relY - p2.relY) * drawHeight;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle canvas click
  const handleCanvasClick = (event) => {
    console.log('캔버스 클릭 이벤트 발생');
    console.log('image:', image);
    console.log('canvasRef.current:', canvasRef.current);
    
    if (!image) {
      console.log('이미지가 없음');
      setMessage('먼저 사진을 업로드하거나 카메라로 사진을 찍으세요.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('캔버스 요소가 없음');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    console.log('클릭 좌표 (캔버스 기준):', { clickX, clickY });
    console.log('캔버스 실제 크기:', { width: canvas.width, height: canvas.height });
    console.log('캔버스 표시 크기:', { width: rect.width, height: rect.height });

    // Calculate image dimensions on canvas (same as in drawCanvas)
    const { offsetX, offsetY, drawWidth, drawHeight } = getDrawImageParams(canvas, image);

    console.log('이미지 그리기 영역:', { offsetX, offsetY, drawWidth, drawHeight });

    // 스케일 팩터 계산 (실제 캔버스 크기와 표시 크기의 비율)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    console.log('스케일 팩터:', { scaleX, scaleY });

    // 스케일된 클릭 좌표 계산
    const scaledClickX = clickX * scaleX;
    const scaledClickY = clickY * scaleY;
    
    console.log('스케일된 클릭 좌표:', { scaledClickX, scaledClickY });

    // Check if click is within the image area
    if (scaledClickX < offsetX || scaledClickX > offsetX + drawWidth || 
        scaledClickY < offsetY || scaledClickY > offsetY + drawHeight) {
      console.log('클릭이 이미지 영역 밖임');
      setMessage('이미지 영역 안을 클릭해주세요.');
      return;
    }

    // Convert click coordinates to image coordinates
    const relX = (scaledClickX - offsetX) / drawWidth;
    const relY = (scaledClickY - offsetY) / drawHeight;

    console.log('이미지 좌표:', { relX, relY });

    // Use the recalculated canvas coordinates for drawing
    const newPoint = { relX, relY };
    console.log('새로운 점 (상대좌표):', newPoint);
    console.log('현재 점들:', points);

    if (points.length < 4) {
      const updatedPoints = [...points, newPoint];
      console.log('업데이트된 점들:', updatedPoints);
      setPoints(updatedPoints);

      // Calculate distances
      if (updatedPoints.length === 2) {
        const d1 = calculateDistanceRel(updatedPoints[0], updatedPoints[1], drawWidth, drawHeight);
        console.log('첫 번째 거리 계산:', d1);
        setDistances([d1]);
        setMessage('첫 번째 거리(P1-P2)가 기록되었습니다. 다음 두 점을 클릭하세요.');
      } else if (updatedPoints.length === 4) {
        const d2 = calculateDistanceRel(updatedPoints[2], updatedPoints[3], drawWidth, drawHeight);
        console.log('두 번째 거리 계산:', d2);
        setDistances([distances[0], d2]);
        setMessage('두 번째 거리(P3-P4)가 기록되었습니다. 비율을 확인하세요.');
      } else if (updatedPoints.length === 1) {
        setMessage('두 번째 점을 클릭하여 첫 번째 거리를 측정하세요.');
      } else if (updatedPoints.length === 3) {
        setMessage('네 번째 점을 클릭하여 두 번째 거리를 측정하세요.');
      }
    } else {
      setMessage('모든 점이 찍혔습니다. "점 다시 찍기" 버튼을 눌러 다시 시작하세요.');
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          stopCamera();
          setImage(img);
          setPoints([]);
          setDistances([]);
          setRatio(null);
          setRatioColor('bg-gray-200');
          setMessage('사진이 업로드되었습니다. 점을 클릭하세요.');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();

        videoRef.current.onloadeddata = () => {
          if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            setIsPhotoReady(true);
            setMessage('카메라가 활성화되었습니다. "사진 찍기" 버튼을 눌러 촬영하세요.');
          }
        };

        setStream(mediaStream);
        setIsCameraActive(true);
        setImage(null);
        setPoints([]);
        setDistances([]);
        setRatio(null);
        setRatioColor('bg-gray-200');
        setMessage('카메라가 활성화되었습니다. 비디오 로딩 중...');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('카메라에 접근할 수 없습니다. 권한을 확인하거나 다른 방법을 시도하세요.');
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
      setIsPhotoReady(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.onloadeddata = null;
      }
    }
  }, [stream]);

  // Take photo
  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');

      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      const imageDataUrl = tempCanvas.toDataURL('image/png');

      const img = new Image();
      img.onload = () => {
        stopCamera();
        setImage(img);
        setPoints([]);
        setDistances([]);
        setRatio(null);
        setRatioColor('bg-gray-200');
        setMessage('사진이 촬영되었습니다. 점을 클릭하세요.');
      };
      img.src = imageDataUrl;
    } else {
      setMessage('카메라가 아직 준비되지 않았습니다. 잠시 후 다시 시도하세요.');
    }
  };

  // Reset points only
  const resetPoints = () => {
    setPoints([]);
    setDistances([]);
    setRatio(null);
    setRatioColor('bg-gray-200');
    setMessage('점이 초기화되었습니다. 다시 점을 클릭하세요.');
  };

  // Reset everything
  const resetState = () => {
    stopCamera();
    setImage(null);
    setPoints([]);
    setDistances([]);
    setRatio(null);
    setRatioColor('bg-gray-200');
    setMessage('사진을 업로드하거나 카메라를 시작하여 시작하세요.');
  };

  // Update canvas when image or points change
  useEffect(() => {
    console.log('useEffect: 이미지 또는 점 변경 감지');
    console.log('image:', image);
    console.log('points:', points);
    
    if (image) {
      const canvas = canvasRef.current;
      if (canvas) {
        console.log('캔버스 크기 조정 시작');
        
        // 모바일 화면에 최적화된 크기 계산
        const isMobile = window.innerWidth <= 768;
        const maxWidth = isMobile ? window.innerWidth * 0.9 : Math.min(image.width, window.innerWidth * 0.8);
        const maxHeight = isMobile ? window.innerHeight * 0.4 : Math.min(image.height, window.innerHeight * 0.6);

        let newWidth = maxWidth;
        let newHeight = (image.height / image.width) * newWidth;

        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = (image.width / image.height) * newHeight;
        }

        console.log('새로운 캔버스 크기:', newWidth, 'x', newHeight);
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw after a short delay to ensure canvas is ready
        setTimeout(() => {
          console.log('setTimeout에서 drawCanvas 호출');
          drawCanvas();
        }, 50);
      } else {
        console.log('캔버스 요소를 찾을 수 없음');
      }
    } else {
      console.log('이미지가 없음');
    }
  }, [image, points, drawCanvas]);

  // Update ratio when distances change
  useEffect(() => {
    if (distances.length === 2) {
      const d1 = distances[0];
      const d2 = distances[1];

      if (d1 > 0 && d2 > 0) {
        const calculatedRatio = Math.max(d1, d2) / Math.min(d1, d2);
        setRatio(calculatedRatio);
        setRatioColor(getRatioColor(calculatedRatio));
        setMessage('두 거리의 비율이 계산되었습니다.');
      }
    } else if (distances.length === 1) {
      setMessage('첫 번째 거리가 측정되었습니다. 다음 두 점을 클릭하세요.');
    }
  }, [distances, getRatioColor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          황금비율 측정기
        </h1>

        {/* Image Upload and Camera Section */}
        <div className="mb-6 flex flex-col items-center space-y-4">
          <div className="flex flex-wrap justify-center gap-4">
            <label
              htmlFor="imageUpload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              사진 선택
            </label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {!isCameraActive ? (
              <button
                onClick={startCamera}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
              >
                카메라 시작
              </button>
            ) : (
              <>
                <button
                  onClick={takePhoto}
                  disabled={!isPhotoReady}
                  className={`font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform ${
                    isPhotoReady ? 'bg-green-500 hover:bg-green-600 hover:scale-105' : 'bg-green-300 cursor-not-allowed'
                  } text-white`}
                >
                  사진 찍기
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                  카메라 중지
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">{message}</p>
        </div>

        {/* Video Feed */}
        <div className={`flex justify-center mb-6 border-2 border-gray-300 rounded-lg overflow-hidden ${isCameraActive ? 'block' : 'hidden'}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto max-w-full"
            style={{ maxWidth: '600px', maxHeight: '400px' }}
          ></video>
        </div>

        {/* Canvas Area */}
        {image && (
          <div className="flex justify-center mb-6 border-2 border-gray-300 rounded-lg overflow-hidden relative">
            <canvas
              ref={canvasRef}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = canvasRef.current.getBoundingClientRect();
                const clickX = touch.clientX - rect.left;
                const clickY = touch.clientY - rect.top;
                
                // 터치 이벤트 처리
                if (canvasRef.current && image) {
                  const canvas = canvasRef.current;
                  const rect = canvas.getBoundingClientRect();
                  const scaledClickX = clickX * (canvas.width / rect.width);
                  const scaledClickY = clickY * (canvas.height / rect.height);
                  
                  console.log('터치 좌표:', { clickX, clickY });
                  console.log('스케일된 터치 좌표:', { scaledClickX, scaledClickY });
                  
                  const { offsetX, offsetY, drawWidth, drawHeight } = getDrawImageParams(canvas, image);
                  
                  if (scaledClickX >= offsetX && scaledClickX <= offsetX + drawWidth && 
                      scaledClickY >= offsetY && scaledClickY <= offsetY + drawHeight) {
                    
                    const relX = (scaledClickX - offsetX) / drawWidth;
                    const relY = (scaledClickY - offsetY) / drawHeight;
                    
                    const newPoint = { relX, relY };
                    console.log('터치로 추가된 점:', newPoint);
                    
                    if (points.length < 4) {
                      const updatedPoints = [...points, newPoint];
                      setPoints(updatedPoints);
                      
                      if (updatedPoints.length === 2) {
                        const d1 = calculateDistanceRel(updatedPoints[0], updatedPoints[1], drawWidth, drawHeight);
                        setDistances([d1]);
                        setMessage('첫 번째 거리(P1-P2)가 기록되었습니다. 다음 두 점을 클릭하세요.');
                      } else if (updatedPoints.length === 4) {
                        const d2 = calculateDistanceRel(updatedPoints[2], updatedPoints[3], drawWidth, drawHeight);
                        setDistances([distances[0], d2]);
                        setMessage('두 번째 거리(P3-P4)가 기록되었습니다. 비율을 확인하세요.');
                      } else if (updatedPoints.length === 1) {
                        setMessage('두 번째 점을 클릭하여 첫 번째 거리를 측정하세요.');
                      } else if (updatedPoints.length === 3) {
                        setMessage('네 번째 점을 클릭하여 두 번째 거리를 측정하세요.');
                      }
                    } else {
                      setMessage('모든 점이 찍혔습니다. "점 다시 찍기" 버튼을 눌러 다시 시작하세요.');
                    }
                  } else {
                    setMessage('이미지 영역 안을 클릭해주세요.');
                  }
                }
              }}
              onMouseDown={(e) => {
                // 터치 디바이스가 아닌 경우에만 마우스 클릭 처리
                if (!isTouchDevice) {
                  handleCanvasClick(e);
                }
              }}
              className="bg-gray-200 cursor-crosshair max-w-full h-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            ></canvas>
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              이미지 영역 안을 클릭하세요
            </div>
          </div>
        )}
        
        {/* Placeholder */}
        {!image && !isCameraActive && (
          <div className="flex justify-center items-center mb-6 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-200 text-gray-500" style={{ width: '100%', maxWidth: '600px', height: '400px' }}>
            사진이 표시될 영역
          </div>
        )}

        {/* Measurement Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
          <div className="bg-blue-100 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">거리 1 (P1-P2)</h2>
            <p className="text-2xl font-bold text-blue-600">
              {distances[0] ? `${distances[0].toFixed(2)} px` : 'N/A'}
            </p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-green-800 mb-2">거리 2 (P3-P4)</h2>
            <p className="text-2xl font-bold text-green-600">
              {distances[1] ? `${distances[1].toFixed(2)} px` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Ratio Display */}
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">두 거리의 비율</h2>
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-500 ease-in-out ${ratioColor} shadow-lg`}
          >
            <p className="text-3xl font-bold text-white text-shadow">
              {ratio ? ratio.toFixed(3) : 'N/A'}
            </p>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            (황금비율 1.618에 가까울수록 초록색)
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {image && (
            <button
              onClick={resetPoints}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              점 다시 찍기
            </button>
          )}
          <button
            onClick={() => {
              console.log('=== 디버그 정보 ===');
              console.log('image:', image);
              if (image) {
                console.log('원본 이미지 크기:', image.width, 'x', image.height);
                console.log('이미지 비율:', image.width / image.height);
                console.log('이미지 소스:', image.src.substring(0, 50) + '...');
              }
              console.log('points:', points);
              console.log('distances:', distances);
              console.log('ratio:', ratio);
              console.log('canvasRef.current:', canvasRef.current);
              if (canvasRef.current) {
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                console.log('캔버스 실제 크기:', canvas.width, 'x', canvas.height);
                console.log('캔버스 표시 크기:', rect.width, 'x', rect.height);
                console.log('스케일 팩터:', {
                  x: canvas.width / rect.width,
                  y: canvas.height / rect.height
                });
              }
              if (image && canvasRef.current) {
                // Calculate image dimensions on canvas
                const aspectRatio = image.width / image.height;
                let drawWidth = canvasRef.current.width;
                let drawHeight = canvasRef.current.width / aspectRatio;

                if (drawHeight > canvasRef.current.height) {
                  drawHeight = canvasRef.current.height;
                  drawWidth = canvasRef.current.height * aspectRatio;
                }

                const offsetX = (canvasRef.current.width - drawWidth) / 2;
                const offsetY = (canvasRef.current.height - drawHeight) / 2;

                console.log('이미지 그리기 영역:', { offsetX, offsetY, drawWidth, drawHeight });
                console.log('이미지 영역 비율:', drawWidth / drawHeight);
                console.log('강제로 drawCanvas 호출');
                drawCanvas();
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            디버그
          </button>
          {image && (
            <button
              onClick={() => setShowImageBounds(!showImageBounds)}
              className={`font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 ${
                showImageBounds ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
              } text-white`}
            >
              {showImageBounds ? '경계 숨기기' : '경계 표시'}
            </button>
          )}
          <button
            onClick={resetState}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
};

export default App; 