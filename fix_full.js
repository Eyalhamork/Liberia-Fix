const fs = require('fs');
const path = require('path');

const filePath = './lib/services/subscription.service.ts';
let lines = fs.readFileSync(filePath, 'utf-8').split('\n');

// Helper function to insert type casts into lines
function fixLine(lineNum, replacement) {
  lines[lineNum] = replacement;
}

// PART 1: Fix the import statement
lines[7] = lines[7].replace('import { PaymentService }', 'import { MTNMoMoService }');
lines[18] = lines[18].replace(': PaymentService;', ': MTNMoMoService;');
lines[21] = lines[21].replace('paymentService: PaymentService', 'paymentService: MTNMoMoService');

// PART 2: Process line by line and add type casts
let i = 0;
while (i < lines.length) {
  let line = lines[i];
  let nextLine = i + 1 < lines.length ? lines[i + 1] : '';
  let nextNextLine = i + 2 < lines.length ? lines[i + 2] : '';
  
  // Fix .single() calls to add type casts
  if (line.trim().endsWith('.single();')) {
    // Check context to add appropriate type cast
    let context = '';
    for (let j = Math.max(0, i - 10); j < i; j++) {
      context += lines[j] + '\n';
    }
    
    // processSubscriptionBilling first select
    if (context.includes('provider_subscriptions') && context.includes('providers!inner') && context.includes('profiles!inner')) {
      lines[i] = line.replace('.single();', `.single() as Promise<{
        data: {
          id: string;
          status: string;
          auto_renew: boolean;
          provider_id: string;
          expires_at: string;
          amount: number;
          attempts: number;
          providers: {
            id: string;
            user_id: string;
            profiles: {
              phone: string;
              email: string;
              full_name: string;
            };
          };
        } | null;
        error: any;
      }>;`);
    }
    // existingBilling
    else if (context.includes('subscription_billing_history') && context.includes('billing_cycle_start')) {
      lines[i] = line.replace('.single();', `.single() as Promise<{
        data: { id: string } | null;
        error: any;
      }>;`);
    }
    // cancelSubscription
    else if (context.includes('providers!inner(id)')) {
      lines[i] = line.replace('.single();', `.single() as Promise<{
        data: {
          id: string;
          expires_at: string;
          provider_id: string;
          providers: { id: string };
        } | null;
        error: any;
      }>;`);
    }
    // reactivateSubscription
    else if (context.includes('async reactivateSubscription')) {
      lines[i] = line.replace('.single();', `.single() as Promise<{
        data: {
          id: string;
          status: string;
          expires_at: string;
        } | null;
        error: any;
      }>;`);
    }
  }
  
  // Fix .insert() calls - cast as any
  if (line.includes('await this.supabase') && lines[i + 1] && lines[i + 1].includes('.from(')) {
    if (lines[i + 2] && lines[i + 2].includes('.insert(')) {
      lines[i] = line.replace('await this.supabase', 'await ((this.supabase as any)');
      // Find the closing of insert and add ))
      for (let j = i + 2; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('.insert({')) {
          // This starts the insert, find the closing
          let braceCount = 0;
          let foundStart = false;
          for (let k = j; k < Math.min(j + 30, lines.length); k++) {
            for (let c of lines[k]) {
              if (c === '{') {
                braceCount++;
                foundStart = true;
              } else if (c === '}') {
                braceCount--;
                if (foundStart && braceCount === 0) {
                  // Found closing
                  if (lines[k].includes('});')) {
                    lines[k] = lines[k].replace('});', '}));');
                  }
                  j = k;
                  break;
                }
              }
            }
            if (j !== k && k > j) break;
          }
          break;
        }
      }
    }
  }
  
  // Fix .update() calls - cast as any
  if (line.includes('await this.supabase') && lines[i + 1] && lines[i + 1].includes('.from(') && lines[i + 2] && lines[i + 2].includes('.update(')) {
    lines[i] = line.replace('await this.supabase', 'await ((this.supabase as any)');
    // Find the .eq() closing and add ))
    for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
      if (lines[j].includes('.eq(') && lines[j].includes(');')) {
        lines[j] = lines[j].replace(');', '));');
        break;
      }
    }
  }
  
  i++;
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log('Fixed with comprehensive approach');
