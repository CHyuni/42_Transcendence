const ApiRequests = async (url, options = {}) => {
    const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

    const isFormData = options.body instanceof FormData;
    
    const headers = {
        'X-CSRFToken': csrfToken,
        ...options.headers
    };

    // FormData가 아닐 때만 Content-Type 설정
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: headers
    });

    const currentPath = window.location.pathname;

    if (response.status === 401 && currentPath !== '/' && currentPath !== '/verify-2fa') {
        window.alert('로그인 시간이 만료되어 메인 페이지로 이동합니다.');
        window.location.href = '/';        
    }
    
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
};

export default ApiRequests;