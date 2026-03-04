# Centrifugo Configuration
NEXT_PUBLIC_CENTRIFUGO_WS_URL=ws://localhost:8000/connection/websocket
CENTRIFUGO_API_URL=http://localhost:8000/api
CENTRIFUGO_API_KEY=server_publish_key_998877

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis Configuration (Upstash)
# Sign up at https://upstash.com/ for free tier
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# TURN Server Configuration (Optional - for better WebRTC connectivity)
# Option 1: Twilio (Recommended for production)
# Sign up at https://www.twilio.com/
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Option 2: Xirsys (Alternative)
# Sign up at https://xirsys.com/
# XIRSYS_USERNAME=your_xirsys_username
# XIRSYS_PASSWORD=your_xirsys_password
# XIRSYS_CHANNEL=your_channel_name

# Option 3: Self-hosted TURN server
# TURN_SERVER_URL=turn:your-server.com:3478
# TURN_USERNAME=your_turn_username
# TURN_PASSWORD=your_turn_password

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
