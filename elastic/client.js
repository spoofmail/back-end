const { Client } = require('@elastic/elasticsearch')
const { userHash } = require('../hashids/hashid')

const client = new Client({
    node: 'http://localhost:9200',
    auth: { username: 'elastic', password: 'password' }
})

/*client.deleteByQuery({
    index: 'email',            
    body: {
        query: {
            match_all: {}
        }
    }
}, function (error, response) {
    console.log(response);
});*/

const emailTextSearchString = 'email-text-search'
client.putScript({
    id: emailTextSearchString,
    script: {
        lang: 'mustache',
        source: {
            from: "{{from}}",
            size: "{{size}}",
            query: {
                bool: {
                    filter: [
                        {
                            match: {
                                "user_id": "{{user_id}}",
                            },
                        },
                        {
                            fuzzy: {
                                "text": {
                                    value: "{{query_string}}",
                                    fuzziness: 'AUTO',
                                },
                            },
                        },
                    ],
                },
            },
        },
        params: {
            query_string: "My query string",
            user_id: "User's id of the person searching",
            from: "The starting index of the search",
            size: "The number of results to return",
        },
    },
})

module.exports = {
    elasticEmail: {
        searchTemplates: {
            emailTextSearch: 'email-text-search',
        },
        indexEmail: (data) => {
            return client.index({
                index: 'email',
                id: data.id,
                document: {
                    subject: data.subject,
                    text: data.text,
                    from: data.from,
                    user_id: userHash.decode(data.user_id),
                },
            })
        },
        indexEmailBulk: (dataArray) => {
            return client.bulk({
                refresh: true,
                operations: dataArray.flatMap(data => [{ index: { _index: 'email' } }, {
                    subject: data.subject,
                    text: data.text,
                    from: data.from,
                    user_id: data.user_id,
                }]),
            })
        },
        refreshEmails: () => {
            return client.indices.refresh({ index: 'email' })
        },
        searchEmailsByText: ({ text, user_id, from, size, }) => {
            return client.searchTemplate({
                id: emailTextSearchString,
                params: {
                    user_id: userHash.decode(user_id),
                    query_string: text,
                    from,
                    size,
                }
            })
        },
        countEmails: () => {
            return client.count({ index: 'email' })
        }
    }
}