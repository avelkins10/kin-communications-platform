import BulkActionsDefault from '../src/components/ui/bulk-actions';

async function main() {
  console.log('default keys', Object.keys(BulkActionsDefault));
  console.log('default.BulkActions typeof', typeof (BulkActionsDefault as any).BulkActions);

  try {
    const { BulkActions, commonBulkActions } = await import('../src/components/ui/bulk-actions');
    console.log('BulkActions typeof', typeof BulkActions);
    console.log('commonBulkActions keys', Object.keys(commonBulkActions));
  } catch (error) {
    console.error('Named import failed:', (error as Error).message);
  }
}

main();
