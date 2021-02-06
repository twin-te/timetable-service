import { UntypedServiceImplementation, ServiceDefinition } from '@grpc/grpc-js'

declare module '@grpc/grpc-js' {
  class Server {
    addService<T extends UntypedServiceImplementation>(
      service: ServiceDefinition,
      implementation: T
    ): void
  }
}
