module.exports = {
  entryPoints: ['src/server.ts'], // Ponto de entrada do seu código
  format: 'cjs', // Formato de saída (CommonJS)
  minify: true, // Opcional: para minificar o código
  outfile: 'dist', // Caminho e nome do arquivo JavaScript de saída
  bundle: true, // Opcional: agrupar todas as dependências em um único arquivo
}
