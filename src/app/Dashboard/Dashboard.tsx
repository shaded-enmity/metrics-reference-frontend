import * as React from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import { Link } from 'react-router-dom';

const Dashboard: React.FunctionComponent = () => (
  <PageSection>
    <Title headingLevel="h1" size="lg">Red Hat ShoppingList Dashboard</Title>
    Disrupting the industry to deliver enterprise ready hybrid shopping experience built on open source principles.
    <br />
    <br />
    <div>
      <ul>
        <li><Link to='/lists'>Your ShoppingLists</Link></li>
        <li><Link to='/lists/new'>Create a New ShoppingList</Link></li>
      </ul>
    </div>
  </PageSection>
)

export { Dashboard };
