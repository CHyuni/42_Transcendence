import React, { useState, useEffect } from 'react';

const TwoFactorAuth = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [setupId, setSetupId] = useState('');
  const [userId, setSetuserId] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('user_id');
    if (userIdParam)
    {
      setSetuserId(userIdParam);
    }

    const getQRCode = async () => {
      try {
        console.log('QR 코드 요청 시작');
        const response = await fetch(`/api/oauth/qrcode/?user_id=${userIdParam}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Special-Access': 'true'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('QR 코드 데이터:', data);
        
        if (data.qr_code_url) {
          setQrCodeUrl(data.qr_code_url);
          setSetupId(data.setup_id);
        } else {
          throw new Error('QR code URL is missing from response');
        }
      } catch (error) {
        console.error('QR 코드 가져오기 실패:', error);
        setError('QR 코드 가져오기 실패: ' + error.message);
      }
    };
    
    getQRCode();
  }, []);
  
  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyLoading(true);
    setError('');
  
    try {
      const response = await fetch('/api/totp/verify-2fa/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: token,
          user_id: userId 
         }),
      });
  
      const data = await response.json();
      console.log('Verify response:', data);
      
      if (response.ok) {
        const redirectUrl = data.redirect_url;
        window.location.href = redirectUrl;
      } else {
        setError(data.error || '인증에 실패했습니다.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setVerifyLoading(false);
    }
  };
  
  const handleSave = async () => {
    setSaveLoading(true);
    setError('');
  
    try {
      const response = await fetch('/api/totp/save-2fa/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Special-Access': 'true',
        },
        credentials: 'include',
        body: JSON.stringify({
          setup_id: setupId,
          user_id: userId 
        }),
      });
  
      const data = await response.json();
      
      if (response.ok) {
        setError('성공적으로 저장되었습니다.');
      } else {
        setError(data.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('저장에 실패했습니다.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">2단계 인증 설정</h2>

        {qrCodeUrl && (
          <div className="mb-6 text-center">
            <p className="mb-4 text-sm text-gray-600">
              1. Google Authenticator 앱을 실행하세요<br/>
              2. QR 코드를 스캔하세요<br/>
              3. 생성된 6자리 코드를 입력하여 인증하세요
            </p>
            <div className="mb-4 p-2 bg-gray-100 rounded">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="mx-auto w-48 h-48"
                onError={(e) => {
                  console.error('Image load error:', e);
                  setError('QR 코드 이미지 로딩 실패');
                }}
              />
            </div>
            <div className="text-xs text-gray-500 break-all mt-2">
              QR Code URL: {qrCodeUrl}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="6자리 인증 코드 입력"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
                disabled={verifyLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={verifyLoading || !token}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyLoading ? '확인 중...' : '확인'}
            </button>
          </form>

          {error && (
            <div className={`text-sm text-center ${
              error === '인증이 성공했습니다.' ? 'text-green-500' : 'text-red-500'
            }`}>
              {error}
            </div>
          )}

          <div className="border-t pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveLoading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;