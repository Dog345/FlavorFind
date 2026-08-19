import { redirect } from 'next/navigation'

// Any 404 on this site redirects to the homepage.
// This prevents broken indexed URLs from showing error pages to users.
export default function NotFound() {
  redirect('/')
}
