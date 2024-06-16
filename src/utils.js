export const gql = async (query) => {
  const response = await fetch(`./api/graph`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: query,
  })
  const data = await response.json();
  return data.result;
}