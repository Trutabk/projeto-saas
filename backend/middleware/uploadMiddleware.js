const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cria o diretório de uploads se não existir
const uploadDir = path.join(__dirname, '../../frontend/assets/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Lista ampla de tipos de arquivo permitidos (segurança, mas abrangente)
const allowedExtensions = /jpeg|jpg|png|gif|bmp|webp|svg|ico|tiff|tif|psd|ai|eps|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|csv|tsv|xml|json|md|log|ini|cfg|conf|yaml|yml|html|htm|css|js|jsx|ts|tsx|php|py|java|c|cpp|h|hpp|rb|go|rs|swift|kt|sql|sh|bat|ps1|zip|rar|7z|tar|gz|bz2|xz|tgz|iso|dmg|mp3|wav|ogg|flac|aac|m4a|wma|aiff|mp4|avi|mkv|mov|wmv|flv|webm|m4v|mpg|mpeg|3gp|ogv|mts|m2ts|vob|srt|sub|ass|vtt|ttf|otf|woff|woff2|eot|cur|icns|dll|so|dylib|exe|msi|deb|rpm|apk|ipa|app|jar|war|ear|class|pyc|pyo|pyd|egg|whl|gem|cab|img|bin|dat|db|sqlite|mdb|accdb|pst|ost|eml|msg|vcf|ics|url|webloc|desktop|lnk|alias|sh|bash|zsh|fish|cmd|vbs|scss|sass|less|styl|vue|svelte|astro|pl|pm|t|pod|r|R|rmd|ipynb|jl|dart|fs|fsx|fsi|fsscript|lua|cr|ex|exs|elm|hs|lhs|clj|cljs|cljc|edn|groovy|gradle|scala|sc|mod|sum|lock|toml|env|properties|xsd|xsl|xslt|xhtml|jsp|asp|aspx|phtml|epub|mobi|azw3|fb2|djvu|chm|mpp|mpt|vsd|vsdx|pub|pot|pps|odg|otg|dif|slk|prn|wk1|wk3|wk4|wks|123|wpd|wps|abw|zabw|sxw|stw|sxc|stc|sxi|sti|sxd|std|sxm|sma|smf|sgl|sgf|sgm|sgml|sgc|sgp|sgg|sgr|sgb|sga|sgd|sge|sgf|sgg|sgh|sgi|sgj|sgk|sgl|sgm|sgn|sgo|sgp|sgq|sgr|sgs|sgt|sgu|sgv|sgw|sgx|sgy|sgz|sga|sgb|sgc|sgd|sge|sgf|sgg|sgh|sgi|sgj|sgk|sgl|sgm|sgn|sgo|sgp|sgq|sgr|sgs|sgt|sgu|sgv|sgw|sgx|sgy|sgz|sga|sgb|sgc|sgd|sge|sgf|sgg|sgh|sgi|sgj|sgk|sgl|sgm|sgn|sgo|sgp|sgq|sgr|sgs|sgt|sgu|sgv|sgw|sgx|sgy|sgz|sga|sgb|sgc|sgd|sge|sgf|sgg|sgh|sgi|sgj|sgk|sgl|sgm|sgn|sgo|sgp|sgq|sgr|sgs|sgt|sgu|sgv|sgw|sgx|sgy|sgz|sga|sgb|sgc|sgd|sge|sgf|sgg|sgh|sgi|sgj|sgk|sgl|sgm|sgn|sgo|sgp|sgq|sgr|sgs|sgt|sgu|sgv|sgw|sgx|sgy|sgz|sga|sgb|sgc|sgd|sge|sgf|sgg|sgh|sgi|sgj|sgk|sgl|sgm|sgn|sgo|sgp|sgq|sgr|sgs|sgt|sgu|sgv|sgw|sgx|sgy|sgz/;

// Filtro de tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype.split('/')[1]); // verifica apenas a parte após a barra
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'));
  }
};

// Configuração do multer com limites e filtro
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (aumentei um pouco)
  fileFilter,
});

module.exports = upload;
