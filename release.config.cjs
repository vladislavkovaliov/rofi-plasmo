/**
 * @type {import('semantic-release').Options}
 */
module.exports = {
    branches: ['main'],
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'conventionalcommits',
            },
        ],
        [
            '@semantic-release/release-notes-generator',
            {
                preset: 'conventionalcommits',
                presetConfig: {
                    types: [
                        { type: 'feat', section: 'Features' },
                        { type: 'fix', section: 'Fixes' },
                        { type: 'perf', section: 'Performance Improvements' },
                        { type: 'revert', section: 'Reverts' },
                        { type: 'docs', section: 'Documentation' },
                        { type: 'style', section: 'Styles' },
                        { type: 'chore', section: 'Chores' },
                        { type: 'refactor', section: 'Code Refactoring' },
                        { type: 'test', section: 'Tests' },
                        { type: 'build', section: 'Build' },
                        { type: 'ci', section: 'CI/CD' },
                    ],
                },
                writerOpts: {
                    commitPartial: '* {{header}}{{#if hash}} ({{shortHash}}){{/if}}\n',
                },
            },
        ],
        '@semantic-release/changelog',
        [
            '@semantic-release/npm',
            {
                npmPublish: false,
            },
        ],
        [
            '@semantic-release/exec',
            {
                prepareCmd:
                    'npm run build && cd build/chrome-mv3-prod && zip -r ../../rofi-v$(node -p "require(\'../../package.json\').version").zip .',
            },
        ],
        [
            '@semantic-release/git',
            {
                assets: ['package.json', 'CHANGELOG.md'],
            },
        ],
        [
            '@semantic-release/github',
            {
                draftRelease: true,
                assets: ['rofi-v*.zip'],
            },
        ],
    ],
};
