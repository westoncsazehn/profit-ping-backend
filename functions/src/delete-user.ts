// local
import {coinDB, db} from './firebase-util';


export const deleteUserCoins = async (uid: string) => {
  const userCoinsSnapshot = await coinDB.where("user", "==", uid).get();
  if (userCoinsSnapshot.size === 0) {
    return;
  }
  const batch = db.batch();
  userCoinsSnapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};
