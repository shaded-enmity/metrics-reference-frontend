import * as React from 'react';
import {
  Card, CardTitle, CardBody, DescriptionList, DescriptionListTerm, DescriptionListDescription, DescriptionListGroup,
  PageSection, Button, TextInput, Toolbar, ToolbarContent, ToolbarItem, Wizard, Title,
  ListItem, List, Spinner
} from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { WarehouseIcon, TimesCircleIcon, SaveIcon } from '@patternfly/react-icons';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsBrowser } from '@segment/analytics-next'
import axios from 'axios';


const analytics = AnalyticsBrowser.load({
  writeKey: process.env.SEGMENT_KEY ?? 'invalid-api-key'
})
const qc = new QueryClient();
const API_URL = 'http://localhost:1337'

interface ShoppingListItem {
  name: string;
  amount: number;
}

interface PurchaseInfo {
  providerId: string;
  purchasedAt: string;
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  lastPurchase?: PurchaseInfo;
  updatedAt: string;
}

interface ShoppingProvider {
  id: string;
  name: string;
  description: string | JSX.Element;
  priceBias: number;
  sameDayDelivery: boolean;
}

const columnNames = {
  name: 'Name',
  numItems: 'Number of Items',
  updatedAt: 'Updated At',
  lastPurchase: 'Last Purchase',
};

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

          analytics.track('Update Item Amount', {
            item: item.name,
            delta: newAmount - item.amount,
          })

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
      {list.items.map((item, idx) => <ListItem key={`overview-${idx}`}>{item.amount}x {item.name}</ListItem>)}
    </List>
  </React.Fragment>;
};

const ProviderStep = ({ setProvider, providers }: { setProvider: (_: ShoppingProvider) => void, providers: ShoppingProvider[] }) => {
  const [selected, setSelected] = React.useState<string>("");
  const renderProvider = (provider: ShoppingProvider, index: number) => (
    <Card key={`provider-${index}`}
      hasSelectableInput isSelectableRaised
      isSelected={provider.name === selected}
      onClick={() => {
        setSelected(provider.id);
        setProvider(provider);
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

const ItemList = ({ list, providers }: { list: ShoppingList, providers: ShoppingProvider[] }) => {
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
    { name: 'Choose Provider', component: <ProviderStep setProvider={setProvider} providers={providers} /> },
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
          <Tr key={`list-${item.name}-${rowIndex}`}>
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
                list.items.push({ name: newName, amount });
                reset();

                analytics.track('Add List Item', {
                  list: list.id,
                  item: {
                    name: newName,
                    amount
                  },
                });
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

            analytics.track('Update List', {
              list: list.id,
              deltas: {
                items: updated.length - list.items.length,
                amount: updated.reduce((p, c) => p + c.amount, 0) - list.items.reduce((p, c) => p + c.amount, 0),
              }
            });

            list.items = updated;

            axios
              .post(`${API_URL}/list/update`, { id: list.id, items: updated, name: list.name })
              .then(_ => alert(`Shopping list "${list.name}" was updated`));
          }} isDisabled={isAppending}><SaveIcon /> Save</Button>
        </ToolbarItem>
        <ToolbarItem alignment={{ default: 'alignRight' }}>
          <Button variant='secondary' isDisabled={isAppending} onClick={() => setPurchaseVisible(true)}>
            $ Purchase
          </Button>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
    <Wizard
      title="Make Purchase"
      description={`Follow ${steps.length} simple steps to make your purchase`}
      steps={steps}
      onClose={() => setPurchaseVisible(false)}
      isOpen={purchaseVisible}
      height={400}
      onSave={() => {
        setPurchaseVisible(false);

        analytics.track('Make Purchase', {
          list: list.id,
          provider: provider?.id,
        });

        axios
          .post(
            `${API_URL}/purchase`,
            { listId: list.id, providerId: provider?.id, }
          )
          .then(_ => alert("Your purchase was placed in the queue"));
      }}
    />
  </React.Fragment>;
};

interface TypedQueryResult<T> {
  isLoading: boolean;
  error: null | Error;
  data: undefined | T;
}

const parseJson = <T,>(r: Response): T | undefined => {
  return r.json() as T;
};

const ShoppingListTable: React.FunctionComponent = () => {
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const isExpanded = (name: string) => expanded.includes(name);
  const expand = (name: string) => setExpanded(Array.from(new Set([...expanded, name])));
  const unexpand = (name: string) => setExpanded(expanded.filter(v => v !== name));
  const toggle = (name: string) => isExpanded(name) ? unexpand(name) : expand(name);

  const {
    isLoading: providersLoading,
    error: providersError,
    data: providersData
  }: TypedQueryResult<ShoppingProvider[]> = useQuery({
    queryKey: ['providers'],
    queryFn: () => fetch(`${API_URL}/providers`).then(parseJson),
  });

  const { isLoading, error, data }: TypedQueryResult<ShoppingList[]> = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => fetch(`${API_URL}/`).then(parseJson),
  });

  const loading = () => providersLoading || isLoading;
  const errors = () => providersError || error;

  const getProviderName = (providerId: string) => providersData?.find(v => v.id === providerId)?.name

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
        {loading() && <Spinner isSVG />}
        {!loading() && errors() && `Error: ${errors()?.message}`}
        {!loading() && providersData && data?.map((listInfo, rowIndex) => (
          <Tbody key={listInfo.name} isExpanded={isExpanded(listInfo.name)}>
            <Tr>
              <Td
                expand={{
                  rowIndex,
                  isExpanded: isExpanded(listInfo.name),
                  onToggle: () => toggle(listInfo.name),
                  expandId: 'shoppinglist-expand'
                }}
              />
              <Td dataLabel={columnNames.name}><b>{listInfo.name}</b></Td>
              <Td dataLabel={columnNames.numItems}>{listInfo.items.length}</Td>
              <Td dataLabel={columnNames.updatedAt}>{listInfo.updatedAt}</Td>
              <Td dataLabel={columnNames.lastPurchase}>
                {listInfo.lastPurchase &&
                  <>
                    <WarehouseIcon />{' '}<b>{getProviderName(listInfo.lastPurchase.providerId)}</b> at {listInfo.lastPurchase.purchasedAt.split('.')[0]}
                  </>}
              </Td>
            </Tr>
            <Tr isExpanded={isExpanded(listInfo.name)}>
              <Td colSpan={5} dataLabel={`expanded-${listInfo.name}`}>
                <ItemList list={listInfo} providers={providersData} />
              </Td>
            </Tr>
          </Tbody>
        ))}
      </TableComposable>
    </PageSection>
  );
};


const MyLists: React.FunctionComponent = () => {
  return (
    <QueryClientProvider client={qc}>
      <ShoppingListTable />
    </QueryClientProvider>
  )
};

export { MyLists };