import { ServerUnaryCall, sendUnaryData, Metadata } from '@grpc/grpc-js'
import {
  ServerErrorResponse,
  ServerStatusResponse,
} from '@grpc/grpc-js/build/src/server-call'
import { grpcLogger as logger } from '../logger'
import { GrpcServer } from './types/type'

export function applyLogger<T extends { [key: string]: any }>(
  i: T
): T extends GrpcServer<infer U> ? GrpcServer<U> : never {
  const impl = i
  Object.getOwnPropertyNames(impl)
    .filter((k) => typeof impl[k] === 'function')
    .forEach((k) => {
      const originalImpl = impl[k]
      // @ts-ignore
      impl[k] = function (
        call: ServerUnaryCall<any, any>,
        callback: sendUnaryData<any>
      ) {
        if (logger.isTraceEnabled())
          logger.trace('REQUEST', originalImpl.name, call.request)
        else logger.info('REQUEST', originalImpl.name)

        const originalCallback = callback
        callback = function (
          error: ServerErrorResponse | ServerStatusResponse | null,
          value?: any | null,
          trailer?: Metadata,
          flags?: number
        ) {
          if (error) logger.error('RESPONSE', originalImpl.name, error)
          else if (logger.isTraceEnabled())
            logger.trace('RESPONSE', originalImpl.name, {
              error,
              value: JSON.stringify(value),
              trailer,
              flags,
            })
          else logger.info('RESPONSE', originalImpl.name, 'ok')

          originalCallback(error, value, trailer, flags)
        }
        // @ts-ignore
        originalImpl(call, callback)
      }
    })
  // @ts-ignore
  return impl
}
