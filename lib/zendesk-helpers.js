/* eslint no-unused-vars: 0 */
/* eslint-env browser */
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

    return res.json().then(json => {
        // error handler
        if (json.errors) throw JSON.stringify(json.errors)
        return json
    })
}

function workbench () {
    // eslint-disable-next-line no-undef
    const brandId = String(THEMING.accountInformation.brand_id)
    return graphQl(`
    query ($brandFilters: [String!]){
        workbench (brandFilters: $brandFilters) {
            id
            name
            nickname
            live
            expert
            author
            thumbnail
            updatedAt
        }
    }`, { brandFilters: [brandId] }).then(json => json.data.workbench)
}

async function exportTheme (themeId) {
    const job = await createExportThemeJob(themeId)
    await waitJob(job.id)
    return job.downloadUrl
}

function createExportThemeJob (themeId) {
    return graphQl(`
    mutation($input: CreateExportThemeJobInputType!) {
        createExportThemeJob(input: $input) {
            jobId,
            downloadUrl
        }
    }`, { input: { themeId } })
        .then(json => json.data.createExportThemeJob)
        .then(job => (
            {
                id: job.jobId,
                downloadUrl: job.downloadUrl
            }
        ))
}

function createImportThemeJob () {
    return graphQl(`
        mutation{
            createImportThemeJob() {
                jobId,
                themeId,
                uploadUrl,
                uploadParams
            }
        }`)
        .then(json => json.data.createImportThemeJob)
        .then(job => (
            {
                id: job.jobId,
                themeId: job.themeId,
                uploadUrl: job.uploadUrl,
                uploadParams: JSON.parse(job.uploadParams)
            }
        ))
}

function archiveTheme (themeId) {
    return graphQl(`
            mutation($input: ArchiveThemeInputType!) {
                archiveTheme(input: $input) {
                    id
                }
            }`, { input: { themeId: themeId } })
        .then(json => json.data.archiveTheme.id)
}

function publishTheme (themeId) {
    return graphQl(`
            mutation($input: PublishThemeInputType!) {
                publishTheme(input: $input) {
                    theme {
                        id
                    }
                }
            }`, { input: { themeId: themeId } })
        .then(json => json.data.publishTheme.theme.id)
}

async function waitJob (jobId) {
    const res = await graphQl(`{job(id: "${jobId}") { status, errors{ message } }}`)
        .then(json => json.data.job)
    if (res.status === 'pending') return delay(250).then(() => waitJob(jobId))
    if (res.status === 'failed') throw new Error(res.errors[0].message)
}

function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
