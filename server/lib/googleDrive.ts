import { google } from 'googleapis';

async function getAccessToken(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  const connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function getGoogleDocsClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.docs({ version: 'v1', auth: oauth2Client });
}

export async function createOrUpdateTypeBuddyDocument(content: string): Promise<{ fileId: string; webViewLink: string }> {
  const drive = await getUncachableGoogleDriveClient();
  const docs = await getGoogleDocsClient();
  
  const searchResponse = await drive.files.list({
    q: "name = 'TypeBuddy Notes' and mimeType = 'application/vnd.google-apps.document' and trashed = false",
    fields: 'files(id, name, webViewLink)',
    spaces: 'drive',
  });

  let fileId: string;
  let webViewLink: string;

  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    fileId = searchResponse.data.files[0].id!;
    webViewLink = searchResponse.data.files[0].webViewLink || '';
    
    const doc = await docs.documents.get({ documentId: fileId });
    const endIndex = doc.data.body?.content?.reduce((max, item) => {
      return Math.max(max, item.endIndex || 0);
    }, 1) || 1;

    if (endIndex > 1) {
      await docs.documents.batchUpdate({
        documentId: fileId,
        requestBody: {
          requests: [
            {
              deleteContentRange: {
                range: {
                  startIndex: 1,
                  endIndex: endIndex - 1,
                },
              },
            },
          ],
        },
      });
    }

    if (content.length > 0) {
      await docs.documents.batchUpdate({
        documentId: fileId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        },
      });
    }
  } else {
    const createResponse = await drive.files.create({
      requestBody: {
        name: 'TypeBuddy Notes',
        mimeType: 'application/vnd.google-apps.document',
      },
      fields: 'id, webViewLink',
    });

    fileId = createResponse.data.id!;
    webViewLink = createResponse.data.webViewLink || '';

    if (content.length > 0) {
      await docs.documents.batchUpdate({
        documentId: fileId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        },
      });
    }
  }

  return { fileId, webViewLink };
}

export async function checkGoogleDriveConnection(): Promise<boolean> {
  try {
    await getUncachableGoogleDriveClient();
    return true;
  } catch {
    return false;
  }
}

export async function listTypeBuddyDocuments(): Promise<{ id: string; name: string; modifiedTime: string }[]> {
  const drive = await getUncachableGoogleDriveClient();
  
  const response = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.document' and trashed = false",
    fields: 'files(id, name, modifiedTime)',
    spaces: 'drive',
    orderBy: 'modifiedTime desc',
    pageSize: 20,
  });

  return (response.data.files || []).map(file => ({
    id: file.id!,
    name: file.name || 'Untitled',
    modifiedTime: file.modifiedTime || new Date().toISOString(),
  }));
}

export async function getDocumentContent(fileId: string): Promise<string> {
  const docs = await getGoogleDocsClient();
  
  const doc = await docs.documents.get({ documentId: fileId });
  
  let content = '';
  const body = doc.data.body?.content || [];
  
  for (const element of body) {
    if (element.paragraph?.elements) {
      for (const textRun of element.paragraph.elements) {
        if (textRun.textRun?.content) {
          content += textRun.textRun.content;
        }
      }
    }
  }
  
  return content.trim();
}
