import { config } from "dotenv"
import process from "process"
import { userInfo } from 'os'
config()

const sessionName = "auth"
const prefix = "."
const botName = "Aliya"
const levelLog = "silent"
const brow = "Linux, Chrome, 1.0.0"
const browser = brow.split(',')
const timeZone = "Asia/Jakarta"
const messageLoading = true
export {
  sessionName,
  prefix,
  botName,
  levelLog,
  browser,
  timeZone,
  messageLoading
}
