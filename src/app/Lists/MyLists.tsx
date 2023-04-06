import * as React from 'react';
import {
  Card, CardTitle, CardBody, DescriptionList, DescriptionListTerm, DescriptionListDescription, DescriptionListGroup,
  PageSection, Button, Modal, ModalVariant, TextInput, Toolbar, ToolbarContent, ToolbarItem, Wizard, Title,
  ListItem, List
} from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { WarehouseIcon } from '@patternfly/react-icons/dist/esm/icons/warehouse-icon';
import { TimesCircleIcon } from '@patternfly/react-icons/dist/esm/icons/times-circle-icon';
import { SaveIcon } from '@patternfly/react-icons/dist/esm/icons/save-icon';


interface ShoppingListItem {
  name: string;
  amount: number;
}

interface PurchaseInfo {
  vendor: string;
  purchasedAt: string;
}

interface ShoppingList {
  id: number;
  name: string;
  items: ShoppingListItem[];
  lastPurchase?: PurchaseInfo;
  updatedAt: string;
}

interface ShoppingProvider {
  name: string;
  description: string | JSX.Element;
  priceBias: number;
  sameDayDelivery: boolean;
}

const lists: ShoppingList[] = [
  {
    id: 1,
    name: 'Weekdays',
    items: [
      { name: 'Apples, Red', amount: 4 },
      { name: 'Bread, Sliced', amount: 2 },
      { name: 'Butter, Unsalted', amount: 1 }
    ],
    lastPurchase: { vendor: 'Walmart', purchasedAt: 'March 21st 2023, 3:32 pm' },
    updatedAt: 'March 15th 2023, 8:21 pm'
  },
  {
    id: 2,
    name: 'Weekend',
    items: [
      { name: 'Apples, Red', amount: 4 },
      { name: 'Bread, Sliced', amount: 2 },
    ],
    lastPurchase: { vendor: 'Amazon', purchasedAt: 'March 21st 2023, 3:32 pm' },
    updatedAt: 'March 15th 2023, 8:21 pm'
  },
  {
    id: 3,
    name: 'Party Night',
    items: [
      { name: 'Apples, Red', amount: 4 },
      { name: 'Bread, Sliced', amount: 2 },
      { name: 'Apples, Red', amount: 4 },
      { name: 'Bread, Sliced', amount: 2 },
    ],
    lastPurchase: { vendor: 'Uber', purchasedAt: 'March 21st 2023, 3:32 pm' },
    updatedAt: 'March 15th 2023, 8:21 pm'
  },
];

const columnNames = {
  name: 'Name',
  numItems: 'Number of Items',
  updatedAt: 'Updated At',
  lastPurchase: 'Last Purchase',
};

const providers: ShoppingProvider[] = [
  { name: 'Amazon', description: 'You want it, they have it.', priceBias: 1.25, sameDayDelivery: true },
  { name: 'Walmart', description: 'Pickup or delivery, your choice.', priceBias: 1.2, sameDayDelivery: false },
  { name: 'Uber', description: 'Anything, anytime.', priceBias: 1.8, sameDayDelivery: true },
  { name: 'Brněnka', description: 'Ultimate shopping experience.', priceBias: 1.1, sameDayDelivery: false },
];

/**
  Convert user specified amount to a number, or return `null` if:
   * The original string was null
   * The string is empty or full of whitespace
   * The numeric value parses out as NaN
*/
const toAmount = (amount?: string): number | null => {
  if (!amount) return null;
  const a = amount.trim();
  const p = parseInt(a);
  if (isNaN(p)) return null;
  return p;
};

const ItemAmountChange = ({ item, setHasError }: { item: ShoppingListItem, setHasError: (_: boolean) => void }) => {
  const [amount, setAmount] = React.useState<string>(`${item.amount}`);
  const [validation, setValidation] = React.useState<'default' | 'error'>('default');

  return (
    <TextInput type='number'
      value={amount}
      validated={validation}
      onChange={(val) => {
        setAmount(val);
        const newAmount = toAmount(val);
        if (newAmount == null) {
          setValidation('error');
          setHasError(true);
        } else {
          setValidation('default');
          setHasError(false);
          item.amount = newAmount;
        }
      }}
    />
  );
};

const OverviewStep = ({ list }: { list: ShoppingList }) => {
  return <React.Fragment>
    <Title headingLevel='h1'>ShoppingList Overview</Title>
    <br />
    <List>
      {list.items.map(item => <ListItem>{item.amount}x {item.name}</ListItem>)}
    </List>
  </React.Fragment>;
};

const ProviderStep = ({ setProvider }: { setProvider: (_: ShoppingProvider) => void }) => {
  const [selected, setSelected] = React.useState<string>("");
  const renderProvider = (provider: ShoppingProvider, index: number) => (
    <Card key={`provider-${index}`}
      hasSelectableInput isSelectableRaised
      isSelected={provider.name === selected}
      onClick={() => {
        setSelected(provider.name);
        setProvider(provider)
      }}
    >
      <CardTitle>
        {provider.name}
      </CardTitle>
      <CardBody>
        {provider.description}
      </CardBody>
    </Card>
  );

  return (
    <React.Fragment>
      {providers.map(renderProvider)}
    </React.Fragment>
  );
};

const ReviewStep = ({ list, provider }: { list: ShoppingList, provider: ShoppingProvider | null }) => {
  const totalNumber = list.items.map(v => v.amount).reduce((p, c) => p + c);
  const delivery = provider?.sameDayDelivery ? "today" : "tomorrow";

  return <React.Fragment>
    <Title headingLevel='h1'>Review Your Purchase</Title>
    <br />
    <DescriptionList isHorizontal>
      <DescriptionListGroup>
        <DescriptionListTerm>
          Total Number of Items
        </DescriptionListTerm>
        <DescriptionListDescription>
          {totalNumber}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          Estimated Price
        </DescriptionListTerm>
        <DescriptionListDescription>
          {provider && (`${Math.round(totalNumber * provider.priceBias)} USD`) || 'No provider selected'}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          Delivery
        </DescriptionListTerm>
        <DescriptionListDescription>
          {delivery}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          Provider:
        </DescriptionListTerm>
        <DescriptionListDescription>
          {provider?.name}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  </React.Fragment>;
};

const ItemList = ({ list }: { list: ShoppingList }) => {
  const [removed, setRemoved] = React.useState<number[]>([]);
  const [isAppending, setIsAppending] = React.useState(false);
  const [newName, setNewName] = React.useState<string>("");
  const [newAmount, setNewAmount] = React.useState<string>("");
  const [numError, setNumError] = React.useState<number>(0);
  const [purchaseVisible, setPurchaseVisible] = React.useState<boolean>(false);
  const [provider, setProvider] = React.useState<ShoppingProvider | null>(null);

  const reset = () => {
    setIsAppending(false);
    setNewName("");
    setNewAmount("");
  };

  const steps = [
    { name: 'Overview', component: <OverviewStep list={list} /> },
    { name: 'Choose Provider', component: <ProviderStep setProvider={setProvider} /> },
    { name: 'Review', component: <ReviewStep list={list} provider={provider} />, nextButtonText: 'Purchase' }
  ];

  return <React.Fragment>
    <TableComposable variant={'compact'} aria-label='Item List'>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Amount</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {list.items.map((item, rowIndex) => !removed.includes(rowIndex) && (
          <Tr>
            <Td>{item.name}</Td>
            <Td>
              <ItemAmountChange item={item} setHasError={(v) => v ? setNumError(numError + 1) : setNumError(numError - 1)} />
            </Td>
            <Td>
              <Button isDanger variant='link' title='Remove item from the list' onClick={() => setRemoved([...removed, rowIndex])}>
                <TimesCircleIcon />
              </Button>
            </Td>
          </Tr>
        ))}
        {isAppending && (
          <Tr>
            <Td><TextInput value={newName} onChange={setNewName} /></Td>
            <Td><TextInput value={newAmount} onChange={setNewAmount} /></Td>
            <Td>
              <Button title='Confirm adding new item' variant='link' onClick={() => {
                const amount = toAmount(newAmount);
                if (amount == null) { alert(`Value ${newAmount} is not a number`); return; }
                list.items.push({ name: newName, amount: parseInt(newAmount) });
                reset();
              }}>Confirm</Button>
              {' '}
              <Button variant='link' title='Cancel' onClick={reset}>Cancel</Button></Td>
          </Tr>
        )}
      </Tbody>
    </TableComposable>
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <Button title='Add new item to the ShoppingList' onClick={() => setIsAppending(true)} isDisabled={isAppending}>+ Add New Item</Button>
        </ToolbarItem>
        <ToolbarItem>
          <Button title='Save changes to the ShoppingList' onClick={() => {
            if (numError > 0) {
              alert("Unable to save a ShoppingList with outstanding errors");
              return;
            }
            const updated = list.items.filter((_, i) => !removed.includes(i));
            list.items = updated;

            setTimeout(() => alert(JSON.stringify(updated, undefined, '   ')), 1000 * Math.random());
          }} isDisabled={isAppending}><SaveIcon /> Save</Button>
        </ToolbarItem>
        <ToolbarItem alignment={{ default: 'alignRight' }}><Button variant='secondary' isDisabled={isAppending} onClick={() => setPurchaseVisible(true)}>$ Purchase</Button></ToolbarItem>
      </ToolbarContent>
    </Toolbar>
    <Modal variant={ModalVariant.large} isOpen={purchaseVisible} onClose={() => setPurchaseVisible(false)} hasNoBodyWrapper showClose={false}>
      <Wizard
        title="Make Purchase"
        description={`Follow ${steps.length} simple steps to make your purchase`}
        steps={steps}
        onClose={() => setPurchaseVisible(false)}
        height={400}
        onSave={() => {
          setPurchaseVisible(false);
          setTimeout(() => alert('Your purchase is being processed'), 1000 * Math.random());
        }}
      />
    </Modal>
  </React.Fragment>;
};


const MyLists: React.FunctionComponent = () => {
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const isExpanded = (name: string) => expanded.includes(name);
  const expand = (name: string) => setExpanded(Array.from(new Set([...expanded, name])));
  const unexpand = (name: string) => setExpanded(expanded.filter(v => v !== name));
  const toggle = (name: string) => isExpanded(name) ? unexpand(name) : expand(name);

  return (
    <PageSection>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            All Your ShoppingLists
          </ToolbarItem>
          <ToolbarItem alignment={{ default: 'alignRight' }}><Button>+ New ShoppingList</Button></ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <TableComposable
        aria-label="All Your ShoppingLists"
        variant={'compact'}
      >
        <Thead>
          <Tr>
            <Th />
            <Th>{columnNames.name}</Th>
            <Th>{columnNames.numItems}</Th>
            <Th>{columnNames.updatedAt}</Th>
            <Th>{columnNames.lastPurchase}</Th>
          </Tr>
        </Thead>
        {lists.map((listInfo, rowIndex) => (
          <Tbody key={listInfo.name} isExpanded={isExpanded(listInfo.name)}>
            <Tr>
              <Td
                expand={
                  {
                    rowIndex,
                    isExpanded: isExpanded(listInfo.name),
                    onToggle: () => toggle(listInfo.name),
                    expandId: 'shoppinglist-expand'
                  }
                }
              />
              <Td dataLabel={columnNames.name}><b>{listInfo.name}</b></Td>
              <Td dataLabel={columnNames.numItems}>{listInfo.items.length}</Td>
              <Td dataLabel={columnNames.updatedAt}>{listInfo.updatedAt}</Td>
              <Td dataLabel={columnNames.lastPurchase}>
                {listInfo.lastPurchase &&
                  <React.Fragment>
                    <WarehouseIcon />{' '}<b>{listInfo.lastPurchase.vendor}</b> at {listInfo.lastPurchase.purchasedAt}
                  </React.Fragment>}
              </Td>
            </Tr>
            <Tr isExpanded={isExpanded(listInfo.name)}>
              <Td colSpan={5} dataLabel={`expanded-${listInfo.name}`}>
                <ItemList list={listInfo} />
              </Td>
            </Tr>
          </Tbody>
        ))}
      </TableComposable>
    </PageSection>
  )
};

export { MyLists };