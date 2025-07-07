import React, { useRef, useState, useEffect, useCallback } from 'react';

// Main App component for the ratio calculator
const App = () => {
  // Ref for the canvas element
  const canvasRef = useRef(null);
  // State for the 2D rendering context of the canvas
  const [ctx, setCtx] = useState(null);
  // State for the loaded image
  const [image, setImage] = useState(null);
  // State to store the clicked points on the canvas
  const [points, setPoints] = useState([]); // Max 4 points: P1, P2, P3, P4
  // State to store the calculated distances
  const [distances, setDistances] = useState([]); // Max 2 distances: D1 (P1-P2), D2 (P3-P4)
  // State for the calculated ratio
  const [ratio, setRatio] = useState(null);
  // State for the color indicator based on the ratio
  const [ratioColor, setRatioColor] = useState('bg-gray-200'); // Default gray color
  // State for messages to the user
  const [message, setMessage] = useState('사진을 업로드하거나 카메라를 시작하여 시작하세요.');

  // Ref for the video element to display camera feed
  const videoRef = useRef(null);
  // State to hold the camera stream
  const [stream, setStream] = useState(null);
  // State to indicate if camera is active
  const [isCameraActive, setIsCameraActive] = useState(false);
  // State to indicate if the photo can be taken (video is ready)
  const [isPhotoReady, setIsPhotoReady] = useState(false);


  // Initialize canvas context when component mounts or canvasRef changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      setCtx(context);
    }
  }, [canvasRef]);

  // Function to draw everything on the canvas
  const drawCanvas = useCallback(() => {
    if (!ctx || !canvasRef.current) return;

    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Draw the image if loaded
    if (image) {
      // Calculate aspect ratio to fit image within canvas without distortion
      const aspectRatio = image.width / image.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.width / aspectRatio;

      if (drawHeight > canvas.height) {
        drawHeight = canvas.height;
        drawWidth = canvas.height * aspectRatio;
      }

      // Center the image on the canvas
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Draw points and lines
    points.forEach((point, index) => {
      // Draw point
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); // Draw a circle for the point
      ctx.fillStyle = '#FF0000'; // Red color for points
      ctx.fill();
      ctx.closePath();

      // Draw point number
      ctx.font = '14px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(`P${index + 1}`, point.x + 8, point.y - 8);

      // Draw lines between P1-P2 and P3-P4
      if (index === 1 && points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.strokeStyle = '#0000FF'; // Blue color for the first line
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      } else if (index === 3 && points.length >= 4) {
        ctx.beginPath();
        ctx.moveTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.strokeStyle = '#008000'; // Green color for the second line
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }
    });
  }, [ctx, image, points]);

  // Redraw canvas whenever points or image change
  useEffect(() => {
    drawCanvas();
  }, [points, image, drawCanvas]);

  // Function to handle image file selection
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          // Set canvas dimensions to fit the image or a default size
          const canvas = canvasRef.current;
          if (canvas) {
            // Set a max width for the canvas to be responsive
            const maxWidth = Math.min(img.width, window.innerWidth * 0.8);
            const maxHeight = Math.min(img.height, window.innerHeight * 0.6);

            let newWidth = maxWidth;
            let newHeight = (img.height / img.width) * newWidth;

            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = (img.width / img.height) * newHeight;
            }

            canvas.width = newWidth;
            canvas.height = newHeight;
            drawCanvas(); // Redraw after setting dimensions
            setMessage('사진이 업로드되었습니다. 점을 클릭하세요.');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      stopCamera(); // Stop camera if a file is uploaded
      // When a new file is uploaded, reset all points/distances
      setPoints([]);
      setDistances([]);
      setRatio(null);
      setRatioColor('bg-gray-200');
      setIsPhotoReady(false); // Disable photo button if new image is loaded
    }
  };

  // Calculate Euclidean distance between two points
  const calculateDistance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Determine the color based on the ratio
  const getRatioColor = useCallback((ratioValue) => {
    if (ratioValue === null) return 'bg-gray-200';
    if (ratioValue > 3) return 'bg-red-500';
    if (ratioValue >= 2) return 'bg-orange-500';
    if (ratioValue >= 1.75) return 'bg-yellow-500';
    if (ratioValue >= 1.5) return 'bg-green-500';
    return 'bg-gray-200'; // Default for ratios below 1.5
  }, []);

  // Effect to update ratio and color when distances change
  useEffect(() => {
    if (distances.length === 2) {
      const d1 = distances[0];
      const d2 = distances[1];

      // Calculate ratio ensuring it's always >= 1
      const calculatedRatio = Math.max(d1, d2) / Math.min(d1, d2);
      setRatio(calculatedRatio);
      setRatioColor(getRatioColor(calculatedRatio));
      setMessage('두 거리의 비율이 계산되었습니다.');
    }
  }, [distances, getRatioColor]);

  // Handle click events on the canvas
  const handleCanvasClick = (event) => {
    if (!ctx || !image) {
      setMessage('먼저 사진을 업로드하거나 카메라로 사진을 찍으세요.');
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate click coordinates relative to the image on the canvas
    const aspectRatio = image.width / image.height;
    let drawWidth = canvas.width;
    let drawHeight = canvas.width / aspectRatio;

    if (drawHeight > canvas.height) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * aspectRatio;
    }

    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    const x = (event.clientX - rect.left - offsetX) * (image.width / drawWidth);
    const y = (event.clientY - rect.top - offsetY) * (image.height / drawHeight);

    // Scale back to canvas coordinates for drawing
    const scaledX = (event.clientX - rect.left);
    const scaledY = (event.clientY - rect.top);

    const newPoint = { x: scaledX, y: scaledY };

    // Limit to 4 points (P1, P2, P3, P4)
    if (points.length < 4) {
      setPoints((prevPoints) => {
        const updatedPoints = [...prevPoints, newPoint];

        // Calculate distance after 2nd and 4th click
        if (updatedPoints.length === 2) {
          const dist1 = calculateDistance(updatedPoints[0], updatedPoints[1]);
          setDistances([dist1]);
          setMessage('첫 번째 거리(P1-P2)가 기록되었습니다. 다음 두 점을 클릭하세요.');
        } else if (updatedPoints.length === 4) {
          const dist2 = calculateDistance(updatedPoints[2], updatedPoints[3]);
          setDistances((prevDistances) => [...prevDistances, dist2]);
          setMessage('두 번째 거리(P3-P4)가 기록되었습니다. 비율을 확인하세요.');
        } else if (updatedPoints.length === 1) {
          setMessage('두 번째 점을 클릭하여 첫 번째 거리를 측정하세요.');
        } else if (updatedPoints.length === 3) {
          setMessage('네 번째 점을 클릭하여 두 번째 거리를 측정하세요.');
        }

        return updatedPoints;
      });
    } else {
      setMessage('모든 점이 찍혔습니다. 초기화 버튼을 눌러 다시 시작하세요.');
    }
  };

  // Function to start camera stream
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play(); // Start playing the video stream

        // Add event listener to enable photo button when video is ready
        videoRef.current.onloadeddata = () => {
          if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            setIsPhotoReady(true);
            setMessage('카메라가 활성화되었습니다. "사진 찍기" 버튼을 눌러 촬영하세요.');
          }
        };

        setStream(mediaStream);
        setIsCameraActive(true);
        setImage(null); // Clear any previously loaded image
        // Reset points and distances when starting camera
        setPoints([]);
        setDistances([]);
        setRatio(null);
        setRatioColor('bg-gray-200');
        setMessage('카메라가 활성화되었습니다. 비디오 로딩 중...');
      } else {
        console.error('Video element ref is null.');
        setMessage('카메라를 시작할 수 없습니다. 잠시 후 다시 시도하세요.');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('카메라에 접근할 수 없습니다. 권한을 확인하거나 다른 방법을 시도하세요.');
    }
  };

  // Function to stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
      setIsPhotoReady(false); // Disable photo button when camera stops
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Clear video source
        videoRef.current.onloadeddata = null; // Remove event listener
      }
      setMessage('카메라가 중지되었습니다.');
    }
  };

  // Function to take a photo from the camera feed
  const takePhoto = () => {
    if (videoRef.current && ctx) {
      const video = videoRef.current;
      // Check if video is ready to be drawn and has valid dimensions
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = canvasRef.current;

        // Create a temporary canvas for capturing the image to avoid affecting the display canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw video frame onto temporary canvas
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Get image data from temporary canvas
        const imageDataUrl = tempCanvas.toDataURL('image/png');

        // Create a new Image object from the captured data
        const img = new Image();
        img.onload = () => {
          setImage(img); // Set the new image to display
          stopCamera(); // Stop camera after taking photo

          // Reset points and distances for the new image, but keep the image itself
          setPoints([]);
          setDistances([]);
          setRatio(null);
          setRatioColor('bg-gray-200');
          setMessage('사진이 촬영되었습니다. 점을 클릭하세요.');
        };
        img.src = imageDataUrl; // Set image source to trigger onload

      } else {
        setMessage('카메라가 아직 준비되지 않았거나 유효한 비디오 프레임이 없습니다. 잠시 후 다시 시도하세요.');
      }
    } else {
      setMessage('카메라가 활성화되지 않았거나 준비되지 않았습니다.');
    }
  };

  // Function to reset the application state completely
  const resetState = () => {
    stopCamera(); // Ensure camera is stopped
    setImage(null); // Clear the image
    setPoints([]);
    setDistances([]);
    setRatio(null);
    setRatioColor('bg-gray-200');
    setMessage('사진을 업로드하거나 카메라를 시작하여 시작하세요.');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      // Reset canvas to default placeholder size if no image
      canvasRef.current.width = 600;
      canvasRef.current.height = 400;
    }
  };

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]); // Dependency on stream to ensure cleanup when stream changes or component unmounts


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          황금비율 측정기
        </h1>

        {/* Image Upload and Camera Section */}
        <div className="mb-6 flex flex-col items-center space-y-4">
          <div className="flex space-x-4">
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
                  disabled={!isPhotoReady} // Disable if photo is not ready
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
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>

        {/* Video Feed (always rendered, visibility controlled by CSS) */}
        <div className={`flex justify-center mb-6 border-2 border-gray-300 rounded-lg overflow-hidden ${isCameraActive ? 'block' : 'hidden'}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto max-w-full"
            style={{ maxWidth: '600px', maxHeight: '400px' }} // Max dimensions for video feed
          ></video>
        </div>

        {/* Canvas Area (when image is loaded and camera is not active) */}
        {!isCameraActive && image && (
          <div className="flex justify-center mb-6 border-2 border-gray-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="bg-gray-200 cursor-crosshair max-w-full h-auto"
              // Set initial dimensions, will be adjusted on image load
              width="600"
              height="400"
            ></canvas>
          </div>
        )}
        {/* Placeholder for canvas when no image and no camera */}
        {!isCameraActive && !image && (
          <div className="flex justify-center items-center mb-6 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-200 text-gray-500" style={{ width: '600px', height: '400px' }}>
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
            (1.618에 가까울수록 초록색)
          </p>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
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