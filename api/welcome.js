import { get } from '@vercel/global-config';

export default async function handler(req, res) {
  try {
    const greeting = await get('greeting');
    return res.status(200).json(greeting);
  } catch (error) {
    console.error('Error fetching global config:', error);
    return res.status(500).json({ error: 'Failed to fetch greeting' });
  }
}
