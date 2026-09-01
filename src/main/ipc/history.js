const { ipcMain } = require("electron");
const DocumentHistoryStore = require("../../data/history/DocumentHistoryStore");

function registerHistoryIpc() {
  const historyStore = new DocumentHistoryStore();

  ipcMain.handle("history:getAll", async () => {
    return historyStore.getAll();
  });

  ipcMain.handle("history:saveDocument", async (event, { docId, doc }) => {
    historyStore.saveDocument(docId, doc);
    return { ok: true };
  });

  ipcMain.handle("history:removeDocument", async (event, docId) => {
    historyStore.removeDocument(docId);
    return { ok: true };
  });

  ipcMain.handle("history:setPinned", async (event, pinnedIds) => {
    historyStore.setPinned(pinnedIds);
    return { ok: true };
  });

  ipcMain.handle("history:setRecents", async (event, recentIds) => {
    historyStore.setRecents(recentIds);
    return { ok: true };
  });

  return { historyStore };
}

module.exports = registerHistoryIpc;