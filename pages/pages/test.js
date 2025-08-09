export default function Test() {
  return (
    <div>
      <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Key found' : 'No key found'}</p>
    </div>
  );
}
