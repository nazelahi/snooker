# 🎱 Snooker Application Setup Guide

This guide will help you set up your complete database-driven snooker application.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git (for version control)

## 🚀 Step 1: Environment Setup

### 1.1 Create Environment File

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 1.2 Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Settings → API
3. Copy your Project URL and anon/public key
4. Paste them in your `.env.local` file

## 🗄️ Step 2: Database Setup

### 2.1 Create Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `database/schema.sql`
4. Paste and run the SQL script

This will create:
- ✅ All tables with proper relationships
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for automatic updates
- ✅ Default achievements
- ✅ User registration handler

### 2.2 Verify Database Setup

Run the schema inspection:

```bash
npm run inspect:schema
```

You should see all tables created successfully.

## 🔧 Step 3: Application Setup

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Start Development Server

```bash
npm run dev
```

### 3.3 Test Database Connection

Visit `http://localhost:9002/test-connection` to verify your database connection.

## 📊 Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User profiles | Extends Supabase auth, handles user data |
| `players` | Player statistics | Skill levels, match history, achievements |
| `tournaments` | Tournament management | Brackets, prizes, scheduling |
| `matches` | Match tracking | Frame scoring, player assignments |
| `match_players` | Match participants | Player assignments, scores |
| `match_frames` | Frame details | Individual frame scoring |
| `comments` | Social features | Match/tournament discussions |
| `notifications` | User notifications | Real-time updates |
| `achievements` | Gamification | Unlockable achievements |
| `challenges` | Player challenges | Match invitations |
| `statistics` | Player stats | Leaderboards, performance tracking |

### Key Features

- **Row Level Security**: Secure data access
- **Real-time subscriptions**: Live updates
- **Type safety**: Full TypeScript support
- **Performance optimized**: Proper indexing
- **Scalable**: Well-structured relationships

## 🎯 Step 4: Application Features

### Available Pages

- **Home**: `http://localhost:9002/`
- **Players**: `http://localhost:9002/players`
- **Matches**: `http://localhost:9002/matches`
- **Tournaments**: `http://localhost:9002/tournaments`
- **My Stats**: `http://localhost:9002/my-stats`
- **Settings**: `http://localhost:9002/settings`
- **Admin**: `http://localhost:9002/admin`

### Database Tools

- **Connection Test**: `http://localhost:9002/test-connection`
- **Schema Inspector**: `http://localhost:9002/database-schema`

## 🔍 Step 5: Testing Your Setup

### 5.1 Test Database Connection

```bash
npm run test:supabase
```

### 5.2 Inspect Database Schema

```bash
npm run inspect:schema
```

### 5.3 Create Test Data

1. Register a new user account
2. Create a player profile
3. Create a tournament
4. Schedule a match
5. Add players to the match

## 🛠️ Development Workflow

### Database-First Development

1. **Schema Changes**: Update `database/schema.sql`
2. **Type Updates**: Modify `src/types/database.ts`
3. **Service Layer**: Use `src/lib/database.ts` services
4. **UI Components**: Build with database-driven data

### Available Services

```typescript
import { 
  profileService,
  playerService,
  tournamentService,
  matchService,
  frameService,
  commentService,
  notificationService,
  achievementService,
  challengeService,
  statisticsService
} from '@/lib/database';
```

## 🔐 Security Features

- **Row Level Security**: Data access control
- **User Authentication**: Supabase Auth integration
- **Admin Controls**: Role-based permissions
- **Data Validation**: Type-safe operations

## 📈 Performance Features

- **Database Indexes**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Built-in Supabase caching
- **Real-time**: Live data updates

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check your `.env.local` file
   - Verify Supabase credentials
   - Ensure environment variables are loaded

2. **"Table not found" errors**
   - Run the schema.sql script in Supabase
   - Check RLS policies are enabled
   - Verify table names match

3. **Authentication issues**
   - Check Supabase Auth settings
   - Verify email confirmations
   - Check user registration triggers

### Debug Commands

```bash
# Test connection
npm run test:supabase

# Inspect schema
npm run inspect:schema

# Check environment
echo $NEXT_PUBLIC_SUPABASE_URL
```

## 📚 Next Steps

1. **Customize the UI**: Modify components in `src/components/`
2. **Add Features**: Extend the database schema
3. **Deploy**: Use Vercel, Netlify, or your preferred platform
4. **Monitor**: Use Supabase dashboard for insights

## 🆘 Support

- Check the database schema at `http://localhost:9002/database-schema`
- Test connections at `http://localhost:9002/test-connection`
- Review logs in your browser's developer console
- Check Supabase dashboard for database insights

---

🎉 **Congratulations!** Your database-driven snooker application is now ready to use! 