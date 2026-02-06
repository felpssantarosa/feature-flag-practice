# 📚 Projeto: Gerenciador de Feature Flags

O objetivo deste projeto é criar um sistema de gerenciamento de feature flags, permitindo que equipes de desenvolvimento ativem ou desativem funcionalidades de forma dinâmica. O sistema deve ser flexível o suficiente para suportar diferentes tipos de regras de avaliação e múltiplos ambientes.

# 📖 Descrição e Requisitos do Projeto

## 1. 🌍 Ambientes

O sistema deve suportar múltiplos ambientes:

- development

- staging

- production

Cada ambiente possui seu próprio conjunto de flags.

<br/>

## 2. 🏳️ Feature Flags

Uma feature flag possui:

```
- key (string, única por ambiente)

- enabled (boolean)

- description (opcional)

- rules (opcional)
```
<br/>

## 3. 📏 Regras de Avaliação

Implemente suporte a pelo menos dois tipos de regra:

#### Percentage Rollout

Ativa a flag para uma porcentagem dos usuários.

A decisão deve ser determinística

Não deve usar random por request

O mesmo contexto deve sempre receber o mesmo resultado

#### Targeted Rule

Ativa a flag quando um atributo do contexto corresponder a um conjunto de valores.

<br/>

Exemplo:

```json
{
  "type": "target",
  "attribute": "country",
  "values": ["BR", "PT"]
}
```

<br/>

## 4. 👮 Avaliação de Flags

A API deve expor um endpoint que:

- Recebe um contexto arbitrário

- Retorna se a flag está ativa ou não

- Informa o motivo da decisão

#### 🌐 Endpoints Esperados

Criar / atualizar flag

`PUT /environments/{env}/flags/{key}`

Avaliar flag

`POST /environments/{env}/evaluate`


Request:

```json
{
  "flag": "new-checkout",
  "context": {
    "userId": "123",
    "country": "BR"
  }
}
```


Response:

```json
{
  "enabled": true,
  "reason": "percentage-rule"
}
```

<br/>

## 🛠️ Requisitos Técnicos

- Linguagem: JavaScript ou TypeScript ✅

- Persistência: livre (SQLite, arquivo, memória) ✅

- A aplicação deve rodar localmente

- Instruções claras no README

<br/>

## ⭐ Diferenciais (não obrigatórios)

Implemente um ou mais:

- Cache de avaliação

- Histórico de mudanças das flags

- Kill switch por ambiente

- Endpoint de snapshot (avaliar múltiplas flags de uma vez)

- Testes automatizados da lógica de avaliação

<br/>

## 📄 O que será avaliado

- Clareza do código

- Organização do projeto

- Modelagem do problema

- Tradeoffs técnicos

- Qualidade do README

## 🚫 Fora de escopo

- Autenticação de usuários

- Interface gráfica completa

- Deploy em cloud

## ⏱️ Tempo esperado

3 a 7 dias.