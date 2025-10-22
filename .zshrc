export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"

# Плагины
plugins=(
  git
  node
  npm
  docker
  docker-compose
  zsh-autosuggestions
  zsh-syntax-highlighting
)

source $ZSH/oh-my-zsh.sh

# Алиасы
alias gst="git status"
alias gc="git commit"
alias gp="git push"
alias ll="ls -la"

# Node.js и npm настройки
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Добавляем глобальные npm пакеты в PATH
export PATH="$HOME/.npm-global/bin:$PATH"
export PATH="/usr/local/bin:$PATH"
export PATH="$NVM_DIR/versions/node/$(nvm current)/bin:$PATH"

# npm конфигурация
export npm_config_prefix="$HOME/.npm-global"

# Автозагрузка node версии
nvm use default &>/dev/null || nvm use --lts &>/dev/null

# npm global packages without sudo
NPM_PACKAGES="${HOME}/.npm-packages"
export PATH="$PATH:$NPM_PACKAGES/bin"

# Gemini CLI aliases
alias gm="gemini"
alias gml="gemini login"
