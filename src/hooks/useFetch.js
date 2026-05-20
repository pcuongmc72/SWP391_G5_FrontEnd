import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch — Custom hook để gọi API với quản lý trạng thái tự động
 *
 * @param {string|null} url      - URL để fetch. Nếu null/undefined sẽ không gọi.
 * @param {object}      options  - Options cho fetch (method, headers, body, etc.)
 * @returns {{ data, loading, error, refetch }}
 *
 * @example
 * const { data, loading, error, refetch } = useFetch('/api/users');
 */
function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);

  // Dùng ref để tránh stale closure và prevent memory leak
  const abortRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    if (!url) return;

    // Hủy request trước nếu còn đang pending
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...optionsRef.current,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useFetch;
