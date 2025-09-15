# Supabase Setup Guide

This guide will help you set up Supabase for the Challengers tournament platform.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `challengers-tournament`
   - Database Password: Generate a strong password
   - Region: Choose the closest region to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon (public) key

## 3. Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Set Up the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `database-schema.sql`
3. Click "Run" to execute the schema

This will create:
- `profiles` table (extends auth.users)
- `tournaments` table
- `participants` table
- `matches` table
- `chat_messages` table
- `notifications` table
- All necessary indexes, triggers, and RLS policies

## 5. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure the following:

### Site URL
- Set to `http://localhost:5173` for development
- Set to your production domain for production

### Redirect URLs
Add these URLs to the allowed redirect URLs:
- `http://localhost:5173/**` (for development)
- `https://yourdomain.com/**` (for production)

### Email Templates
Customize the email templates for:
- Confirm signup
- Reset password
- Magic link

## 6. Configure Row Level Security (RLS)

The database schema includes comprehensive RLS policies that:
- Allow users to view all profiles
- Allow users to update only their own profile
- Allow anyone to view published tournaments
- Allow organizers to manage their own tournaments
- Allow users to join/leave tournaments
- Allow users to view tournament participants
- Allow users to view matches
- Allow tournament organizers to manage matches
- Allow users to send messages to tournaments they're participating in
- Allow users to view their own notifications

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Try to sign up for a new account
3. Check that the user profile is created in the `profiles` table
4. Try to create a tournament (if you're an organizer)
5. Test the real-time features

## 8. Production Considerations

### Security
- Review and test all RLS policies
- Set up proper CORS policies
- Use environment-specific redirect URLs
- Consider implementing rate limiting

### Performance
- Monitor database performance
- Set up proper indexes for your query patterns
- Consider implementing database connection pooling

### Monitoring
- Set up Supabase monitoring
- Configure alerts for errors
- Monitor authentication metrics

## 9. Database Functions

The schema includes several useful functions:

### `increment_participant_count(tournament_id)`
Automatically increments the participant count when someone joins a tournament.

### `decrement_participant_count(tournament_id)`
Automatically decrements the participant count when someone leaves a tournament.

### `handle_new_user()`
Automatically creates a profile when a new user signs up.

## 10. Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure all policies are properly configured
2. **Authentication Issues**: Check your redirect URLs and site URL settings
3. **Real-time Not Working**: Ensure you're subscribed to the correct channels
4. **Profile Not Created**: Check the `handle_new_user()` trigger

### Debug Mode

Enable debug mode in your Supabase client:

```typescript
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});
```

## 11. Next Steps

After setting up the database:

1. Test all authentication flows
2. Test tournament creation and management
3. Test real-time features
4. Set up proper error handling
5. Implement proper loading states
6. Add comprehensive testing

## Support

If you encounter any issues:
1. Check the Supabase documentation
2. Review the error logs in your Supabase dashboard
3. Check the browser console for client-side errors
4. Verify your environment variables are correct
