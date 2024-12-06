package com.fileviewerturbo;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.MimeTypeMap;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import java.io.File;
import java.math.BigInteger;

public class FileViewerTurboModuleImpl {
  final private ReactApplicationContext mContext;
  public static final String NAME = "FileViewerTurbo";
  private static final String SHOW_OPEN_WITH_DIALOG = "showOpenWithDialog" ;
  private static final String SHOW_STORE_SUGGESTIONS ="showAppsSuggestions";
  private static final Integer RN_FILE_VIEWER_REQUEST = 33341;

  public FileViewerTurboModuleImpl(ReactApplicationContext context) {
    mContext = context;
  }

  public void open(String path, String currentId, ReadableMap options, Promise promise) {
    Uri contentUri = null;
    Boolean showOpenWithDialog = options.hasKey(SHOW_OPEN_WITH_DIALOG) ? options.getBoolean(SHOW_OPEN_WITH_DIALOG) : false;
    Boolean showStoreSuggestions = options.hasKey(SHOW_STORE_SUGGESTIONS) ? options.getBoolean(SHOW_STORE_SUGGESTIONS) : false;

    if(path.startsWith("content://")) {
      contentUri = Uri.parse(path);
    } else {
      File newFile = new File(path);

      if(mContext.getCurrentActivity() == null) {
        promise.reject("FileViewerTurbo:open", "Activity doesn't exist");
        return;
      }
      try {
        final String packageName = mContext.getCurrentActivity().getPackageName();
        final String authority = new StringBuilder(packageName).append(".provider").toString();
        contentUri = FileProvider.getUriForFile(mContext.getCurrentActivity(), authority, newFile);
      }
      catch(IllegalArgumentException e) {
        promise.reject("FileViewerTurbo:open", e);
        return;
      }
    }

    if(contentUri == null) {
      promise.reject("FileViewerTurbo:open", "Invalid file");
      return;
    }

    String extension = MimeTypeMap.getFileExtensionFromUrl(path).toLowerCase();
    String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);

    Intent shareIntent = new Intent();
    shareIntent.setAction(Intent.ACTION_VIEW);
    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    shareIntent.setDataAndType(contentUri, mimeType);
    shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
    Intent intentActivity;

    if (showOpenWithDialog) {
      intentActivity = Intent.createChooser(shareIntent, "Open with");
    } else {
      intentActivity = shareIntent;
    }

    PackageManager pm = mContext.getCurrentActivity().getPackageManager();

    if (shareIntent.resolveActivity(pm) != null) {
      try {
        mContext.getCurrentActivity().startActivityForResult(intentActivity, new BigInteger(currentId.replace("-", ""), 16).intValue() + RN_FILE_VIEWER_REQUEST);
        promise.resolve(null);
      }
      catch(Exception e) {
        promise.reject("FileViewerTurbo:open", e);
      }
    } else {
      try {
        if (showStoreSuggestions) {
          if (mimeType == null) {
            promise.reject("FileViewerTurbo:open", "It wasn't possible to detect the type of the file");
          }
          Intent storeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=" + mimeType + "&c=apps"));
          mContext.getCurrentActivity().startActivity(storeIntent);
        }
        promise.reject("FileViewerTurbo:open", "No app associated with this mime type");
      }
      catch(Exception e) {
        promise.reject("FileViewerTurbo:open", e);
      }
    }
  }
}
