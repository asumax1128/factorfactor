'use strict';
// One display rule for the equipped title, shared by profile / HOME / ranking (presentation only, nothing is written here):
//   stats.nick = a title id -> that title                       (state 'nick')
//   stats.nick = ""         -> explicitly unequipped: no title  (state 'cleared')
//   stats.nick absent       -> the legacy ranking title (onlineSparkV1 profile.title) is shown for compatibility (state 'compat')
// A non-empty nick that cannot be resolved to a known title shows nothing (never guessed).
function resolve({ nick, title }, { valid }) {
  if (typeof nick === 'string') {
    if (nick === '') return { state: 'cleared', id: null };
    return valid(nick) ? { state: 'nick', id: nick } : { state: 'unresolved', id: null };
  }
  if (nick !== undefined && nick !== null) return { state: 'unresolved', id: null };
  if (typeof title === 'string' && title !== '' && valid(title)) return { state: 'compat', id: title };
  return { state: 'none', id: null };
}
// The id that is shown as "equipped" (explicit slot or legacy compatibility), or null.
const shownId = (d) => (d.state === 'nick' || d.state === 'compat' ? d.id : null);
module.exports = { resolve, shownId };
