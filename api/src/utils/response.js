const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })
const fail = (res, msg, status = 400) => res.status(status).json({ success: false, message: msg })

module.exports = { ok, fail }