export type VerificationStatus = 'pass' | 'warn' | 'fail' | 'na';

export interface VerificationItem {
  key: string;
  status: VerificationStatus;
  noteKey?: string;
}

export interface VerificationCategory {
  key: string;
  descKey: string;
  items: VerificationItem[];
}

export const verificationData: VerificationCategory[] = [
  {
    key: 'verificationPage.cat1',
    descKey: 'verificationPage.cat1Desc',
    items: [
      { key: 'verificationPage.item1_1', status: 'pass' },
      { key: 'verificationPage.item1_2', status: 'pass' },
      { key: 'verificationPage.item1_3', status: 'pass' },
      { key: 'verificationPage.item1_4', status: 'pass' },
      { key: 'verificationPage.item1_5', status: 'pass' },
      { key: 'verificationPage.item1_6', status: 'pass' },
      { key: 'verificationPage.item1_7', status: 'pass' },
      { key: 'verificationPage.item1_8', status: 'pass' },
    ],
  },
  {
    key: 'verificationPage.cat2',
    descKey: 'verificationPage.cat2Desc',
    items: [
      { key: 'verificationPage.item2_1', status: 'pass' },
      { key: 'verificationPage.item2_2', status: 'pass' },
      { key: 'verificationPage.item2_3', status: 'pass' },
      { key: 'verificationPage.item2_4', status: 'pass' },
    ],
  },
  {
    key: 'verificationPage.cat3',
    descKey: 'verificationPage.cat3Desc',
    items: [
      { key: 'verificationPage.item3_1', status: 'pass' },
      { key: 'verificationPage.item3_2', status: 'pass' },
      { key: 'verificationPage.item3_3', status: 'pass' },
      { key: 'verificationPage.item3_4', status: 'warn', noteKey: 'verificationPage.item3_4Note' },
    ],
  },
  {
    key: 'verificationPage.cat4',
    descKey: 'verificationPage.cat4Desc',
    items: [
      { key: 'verificationPage.item4_1', status: 'pass' },
      { key: 'verificationPage.item4_2', status: 'pass' },
      { key: 'verificationPage.item4_3', status: 'pass' },
      { key: 'verificationPage.item4_4', status: 'warn', noteKey: 'verificationPage.item4_4Note' },
      { key: 'verificationPage.item4_5', status: 'pass' },
    ],
  },
  {
    key: 'verificationPage.cat5',
    descKey: 'verificationPage.cat5Desc',
    items: [
      { key: 'verificationPage.item5_1', status: 'pass' },
      { key: 'verificationPage.item5_2', status: 'pass' },
      { key: 'verificationPage.item5_3', status: 'pass' },
      { key: 'verificationPage.item5_4', status: 'pass' },
    ],
  },
  {
    key: 'verificationPage.cat6',
    descKey: 'verificationPage.cat6Desc',
    items: [
      { key: 'verificationPage.item6_1', status: 'pass' },
      { key: 'verificationPage.item6_2', status: 'pass' },
      { key: 'verificationPage.item6_3', status: 'pass' },
      { key: 'verificationPage.item6_4', status: 'pass' },
    ],
  },
  {
    key: 'verificationPage.cat7',
    descKey: 'verificationPage.cat7Desc',
    items: [
      { key: 'verificationPage.item7_1', status: 'pass' },
      { key: 'verificationPage.item7_2', status: 'pass' },
      { key: 'verificationPage.item7_3', status: 'warn', noteKey: 'verificationPage.item7_3Note' },
      { key: 'verificationPage.item7_4', status: 'pass' },
      { key: 'verificationPage.item7_5', status: 'warn', noteKey: 'verificationPage.item7_5Note' },
      { key: 'verificationPage.item7_6', status: 'warn', noteKey: 'verificationPage.item7_6Note' },
    ],
  },
];
