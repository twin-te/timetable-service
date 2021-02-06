import { connectDatabase } from './database'
import { startGrpcServer } from './grpc'
import { logger } from './logger'

async function main() {
  try {
    await connectDatabase()
    await startGrpcServer()
  } catch (e) {
    logger.fatal(e)
    process.exit(1)
  }
}

main()
