import { Body, Controller, Get, Module, Post } from '../../decorators'
import { createParamDecorator } from '../../helpers'
import type { Constructor } from '../../types'

export function createTestController(): Constructor {
	@Controller('/health')
	class TestController {
		@Get()
		index() {
			return { ok: true }
		}
	}
	return TestController
}

export function createPayloadController(): Constructor {
	@Controller('/payload')
	class PayloadController {
		@Post('echo')
		async echo(@Body('a') a: string, @Body('b') b: string) {
			return { a, b }
		}
	}
	return PayloadController
}

export function createRawResponseController(): Constructor {
	@Controller('/raw')
	class RawResponseController {
		@Get()
		raw() {
			return new Response('raw-ok', {
				status: 201,
				headers: { 'x-honest': 'yes' }
			})
		}
	}
	return RawResponseController
}

export function createOnlyAController(): Constructor {
	@Controller('/only-a')
	class OnlyAController {
		@Get()
		index() {
			return { app: 'a' }
		}
	}
	return OnlyAController
}

export function createOnlyBController(): Constructor {
	@Controller('/only-b')
	class OnlyBController {
		@Get()
		index() {
			return { app: 'b' }
		}
	}
	return OnlyBController
}

export function createUndecoratedController(): Constructor {
	class UndecoratedController {
		hello() {
			return 'hello'
		}
	}
	return UndecoratedController
}

export function createBrokenControllerModule(): Constructor {
	const UndecoratedController = createUndecoratedController()
	@Module({ controllers: [UndecoratedController] })
	class BrokenControllerModule {}
	return BrokenControllerModule
}

export function createEmptyModule(): Constructor {
	@Module()
	class EmptyModule {}
	return EmptyModule
}

export function createDuplicateRouteControllers(): { a: Constructor; b: Constructor } {
	@Controller('/dup')
	class DuplicateAController {
		@Get()
		index() {
			return { ok: 'a' }
		}
	}
	@Controller('/dup')
	class DuplicateBController {
		@Get()
		index() {
			return { ok: 'b' }
		}
	}
	return { a: DuplicateAController, b: DuplicateBController }
}

export function createUnsafeParamController(): Constructor {
	const unsafeParam = createParamDecorator('unsafe')
	@Controller('/unsafe')
	class UnsafeParamController {
		@Get()
		check(@unsafeParam() value: unknown) {
			return { hasValue: value !== undefined }
		}
	}
	return UnsafeParamController
}

export function createDiagnosticsAController(): Constructor {
	@Controller('/diag-a')
	class DiagnosticsAController {
		@Get()
		index() {
			return { controller: 'a' }
		}
	}
	return DiagnosticsAController
}

export function createDiagnosticsBController(): Constructor {
	@Controller('/diag-b')
	class DiagnosticsBController {
		@Get()
		index() {
			return { controller: 'b' }
		}
	}
	return DiagnosticsBController
}

export function createRuntimeMetadataController(): Constructor {
	@Controller('/runtime-metadata')
	class RuntimeMetadataController {
		@Get()
		index() {
			throw new Error('runtime metadata baseline error')
		}
	}
	return RuntimeMetadataController
}
