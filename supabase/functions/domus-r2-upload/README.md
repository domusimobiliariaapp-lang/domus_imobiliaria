# Uploads para Cloudflare R2

O hook `useR2Upload` solicita uma URL assinada à função `domus-r2-upload` e envia o arquivo diretamente ao R2 por PUT. A função valida a sessão e exige equipe interna. As chaves ficam somente nos secrets do Supabase.

## Secrets obrigatórios

- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- R2_PUBLIC_URL: endereço HTTPS real do bucket (domínio próprio ou endereço r2.dev fornecido pelo Cloudflare). Não é derivado do account ID.

Configure os secrets pelo painel do Supabase. A credencial R2 precisa de leitura/escrita de objetos no bucket selecionado. Depois publique:

```sh
npx supabase functions deploy domus-r2-upload --project-ref celdewmegikrlanlrzsg
```

## CORS do bucket

Em Cloudflare > R2 > bucket > Settings > CORS Policy, autorize os domínios usados pelo aplicativo. Exemplo para desenvolvimento (adicione o domínio de produção):

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

A URL de upload expira em cinco minutos. Imagens/documentos têm validação de tamanho declarado de 10 MB e vídeos de 50 MB; a URL assinada não impõe esse limite ao corpo recebido pelo R2. O Content-Type é assinado. Não envie base64.

O contrato atual salva URLs públicas permanentes, inclusive para documentos. Para documentos confidenciais, é necessário um fluxo separado com bucket privado e leitura autenticada; não torne um bucket privado público apenas para usar este fluxo.

Arquivos antigos no Supabase continuam com suas URLs existentes. Esta alteração não migra nem apaga esses arquivos. Para testar: envie uma imagem, um vídeo e um PDF com uma conta interna, salve o cadastro, recarregue e confira os objetos e URLs do R2. Uma falha no R2 deve ser exibida ao usuário, sem fallback para Supabase Storage.

Referências: https://developers.cloudflare.com/r2/examples/aws/aws4fetch/ e https://developers.cloudflare.com/r2/buckets/cors/.
