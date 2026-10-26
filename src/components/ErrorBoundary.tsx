import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/errorLogger'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Captura exceção de renderização e envia para o painel do DEV.
 *
 * Sem isto, um erro em uma tela derrubava a árvore do React para a página em
 * branco, e ninguém ficava sabendo — inclusive o próprio usuário, que só via
 * "something went wrong" do navegador.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void logError(error, 'react-error-boundary', {
      componentStack: info.componentStack,
    })
  }

  private handleReset = () => {
    const isChunkError =
      this.state.error?.message?.includes('dynamically imported module') ||
      this.state.error?.message?.includes('Importing a module script failed')
    if (isChunkError) {
      window.location.reload()
      return
    }
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const isChunkError =
      error.message?.includes('dynamically imported module') ||
      error.message?.includes('Importing a module script failed')

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-[#AD7B3B]" />
          <h1 className="mt-4 font-serif text-2xl">
            {isChunkError ? 'Nova versão disponível' : 'Algo deu errado'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isChunkError
              ? 'Uma nova versão do sistema foi publicada. Recarregue a página para continuar navegando.'
              : 'A tela não pôde ser carregada. O erro foi registrado e já aparece no painel administrativo.'}
          </p>
          <p className="mt-4 text-xs font-mono text-muted-foreground break-words bg-muted/50 rounded-md p-2">
            {error.message}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#17323D] text-white text-sm font-medium hover:bg-[#17323D]/90 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            {isChunkError ? 'Recarregar Versão Atualizada' : 'Tentar de novo'}
          </button>
        </div>
      </div>
    )
  }
}
