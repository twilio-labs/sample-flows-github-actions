const path = require('path');
const { isEqual } = require('lodash');
const fs = require('fs').promises;
const client = require('twilio')(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN
);

async function run() {
  const flowFileName = path.resolve(__dirname, '../flows/webinar-flow.json');
  const flow = JSON.parse(await fs.readFile(flowFileName, 'utf8'));
  const friendlyName = 'webinar-flow.json';

  try {
    await client.studio.flowValidate.update({
      friendlyName,
      definition: flow,
      status: 'published',
    });
  } catch (err) {
    console.error('Invalid flow');
    console.dir(err.details);
    return;
  }

  const allFlows = await client.studio.flows.list();
  const existingFlow = allFlows.find(
    (flow) => flow.friendlyName === friendlyName
  );

  if (!existingFlow) {
    const newFlow = await client.studio.flows.create({
      friendlyName,
      definition: flow,
      status: 'published',
    });
    console.log('Published', newFlow.webhookUrl);
    return;
  }

  const { definition } = await client.studio.flows(existingFlow.sid).fetch();

  if (isEqual(definition, flow)) {
    console.log('No changes');
    return;
  }

  const updatedFlow = await client.studio.flows(existingFlow.sid).update({
    definition: flow,
    status: 'published',
    commitMessage: 'Automated deployment',
  });

  console.log('Updated', updatedFlow.webhookUrl);
}

run().catch(console.error);
