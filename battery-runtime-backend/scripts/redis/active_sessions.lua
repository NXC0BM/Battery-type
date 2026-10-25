-- Активные сессии пользователей Battery Runtime.
-- Сессии хранит connect-redis: ключ "sess:<sid>", значение — JSON
-- вида {"cookie":{...},"userId":5}. Скрипт обходит ключи через SCAN
-- (не блокирует Redis, в отличие от KEYS *), разбирает JSON и
-- возвращает только авторизованные сессии (где есть userId) с их TTL.
--
-- Запуск:  docker exec redis redis-cli EVAL "$(cat scripts/redis/active_sessions.lua)" 0
--          или npm run sessions

local prefix = ARGV[1] or 'sess:'
local result = {}
local cursor = '0'

repeat
  local reply = redis.call('SCAN', cursor, 'MATCH', prefix .. '*', 'COUNT', 100)
  cursor = reply[1]
  for _, key in ipairs(reply[2]) do
    local raw = redis.call('GET', key)
    local ok, data = pcall(cjson.decode, raw)
    if ok and type(data) == 'table' and data.userId then
      local ttl = redis.call('TTL', key)
      table.insert(result, 'userId=' .. tostring(data.userId) .. ' | ttl=' .. ttl .. 's | ' .. key)
    end
  end
until cursor == '0'

table.insert(result, 1, 'active sessions: ' .. #result)
return result
