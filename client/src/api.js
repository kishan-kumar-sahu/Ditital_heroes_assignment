// const BASE = 
// (import.meta.env.VITE_API_URL ||
//    'http://localhost:5000/api').
//    replace(/\/$/, '');




// export async function api(path, opts = {}) {
//   const token = localStorage.getItem('dh_token');
//   const headers = {
//     'Content-Type': 'application/json',
//     ...(opts.headers || {}),
//   };

//   if (token) headers.Authorization = `Bearer ${token}`;

//   let response;
//   try {
//     response = await fetch(`${BASE}${path}`, { ...opts, headers });
//   } catch {
//     throw new Error(`Backend is not reachable at ${BASE}. Start the server and MongoDB.`);
//   }

//   const data = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     if (response.status === 401 && token) {
//       localStorage.removeItem('dh_token');
//       window.dispatchEvent(new Event('dh:logout'));
//     }
//     throw new Error(data.error || data.message || `Request failed (${response.status})`);
//   }

//   return data;
// }




const BASE = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'
).replace(/\/$/, '');

export async function api(path, opts = {}) {
  const token = localStorage.getItem('dh_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let response;

  try {
    response = await fetch(`${BASE}${path}`, {
      ...opts,
      headers,
    });
  } catch {
    throw new Error(
      `Backend is not reachable at ${BASE}. Start the server and MongoDB.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('dh_token');
      window.dispatchEvent(new Event('dh:logout'));
    }

    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}