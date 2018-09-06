/* eslint no-unused-vars: 0 */
async function graphQl (query, variables = null) {
  const headers = new Headers()
  headers.append('X-CSRF-Token', window.THEMING.CSRFToken)

  const body = new FormData()
  body.append('graphql', JSON.stringify({ query, variables }))

  const res = await fetch('/theming/graphql', {
    method: 'post',
    credentials: 'same-origin',
    body,
    headers
  })

  return res.json()
}

async function exportTheme (themeId) {
  const job = await createExportThemeJob(themeId)
  await waitJob(job.id)
  return job.url
}

async function createExportThemeJob (themeId) {
  const query = `
  mutation($input: CreateExportThemeJobInputType!) {
    createExportThemeJob(input: $input) {
      job_id,
      download_url
    }
  }`
  const job = await graphQl(query, { input: {theme_id: themeId} })
    .then(json => json.data.createExportThemeJob)

  return {id: job.job_id, url: job.download_url}
}

async function waitJob (jobId) {
  const status = await graphQl(`{job(id: "${jobId}") { status }}`)
    .then(json => json.data.job.status)

  return status === 'completed' || delay(250).then(() => waitJob(jobId))
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
