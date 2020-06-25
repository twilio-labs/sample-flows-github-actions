# Deploying Functions & Studio Flows via GitHub Actions

This application works as a sample to show how Twilio Functions & Studio Flows
can be tracked together in one repository and deployed automatically via a
Continuous Delivery mechanism such as GitHub Actions.

## Project Structure

```
sample-flows-github-actions
├── LICENSE
├── README.md
├── assets
├── flows
├── functions
├── node_modules
├── package-lock.json
├── package.json
└── scripts

5 directories, 4 files
```

### Twilio Functions & Assets

The `functions` and `assets` folders contain any [Twilio Functions & Assets](https://www.twilio.com/functions) you might want to deploy. They'll be deployed using `npm run ci:deploy-functions` that leverages [`twilio-run`](https://npm.im/twilio-run), that is part of the Twilio Serverless Toolkit](https://www.twilio.com/docs/labs/serverless-toolkit).

### Twilio Studio flows

The `flows` directory is used to store the JSON representation of the [Twilio Studio](https://www.twilio.com/studio) flow we are trying to deploy. In our case that is a `webinar-flow.json` example file. It gets deployed through the `npm run ci:deploy-flows` command that internally runs the `scripts/deployFlows.js` file using the [Twilio Studio API](https://www.twilio.com/docs/studio/rest-api/v2/flow).

### GitHub Actions

You can find the GitHub Actions workflow that is being triggered on each push
to `main` inside `.github/workflows/deploy.yml`. The logic can be ported to any
other CI/CD platform that can:

1. Can store secrets and set them as environment variables
1. Install Node.js
1. Install dependencies from npm
1. Run npm scripts with environment variables

## How to use this project

This project is not intended to immediately work by forking the project.
Instead it is intended to work as a blueprint for your own projects and to
understand how the [Studio Flows API](https://www.twilio.com/docs/studio/rest-api/v2/flow) works.

You might have to change:

1. The name of your flows JSON file
2. Any references to the friendly name in the `deployFlow.js` file to deploy your flow correctly
3. If your flow triggers a Function make sure that the configuration for those is pointing to the correct Function
4. Set your Twilio Account SID and Auth Token as `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` secrets inside GitHub Actions' Secrets Store

**Important** We are currently [scoping out on how to add Studio support directly into the Twilio Serverless Toolkit](https://github.com/twilio-labs/twilio-run/issues/145). We'll update this example once that lands but feel free to chime in with feedback.

## Code of Conduct

This template is open source and welcomes contributions. All contributions are subject to our [Code of Conduct](https://github.com/twilio-labs/.github/blob/master/CODE_OF_CONDUCT.md).

## License

MIT
